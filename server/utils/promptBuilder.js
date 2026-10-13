import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { maskSensitiveData } from './piiMasker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

const readPromptFile = (filename) => {
  const fullPath = path.join(PROMPTS_DIR, filename);
  return fs.readFileSync(fullPath, 'utf-8');
};

export const extractFirstName = (fullName = 'ลูกค้า') => {
  const cleaned = (fullName || 'ลูกค้า')
    .replace(/^(คุณ|บจก\.|หจก\.|บมจ\.|บริษัท)\s*/i, '')
    .trim();
  const parts = cleaned.split(/\s+/);
  return parts[0] || 'ลูกค้า';
};

export const selectRelevantCannedResponses = (cannedList = [], messages = [], limit = 7) => {
  if (!Array.isArray(cannedList) || cannedList.length === 0) return [];

  const recentText = messages
    .slice(-5)
    .map((m) => m.text || '')
    .join(' ')
    .toLowerCase();

  const scored = cannedList
    .filter((c) => c.is_active !== false && c.isActive !== false)
    .map((c) => {
      let score = 0;
      const tags = Array.isArray(c.tags) ? c.tags : [];
      for (const tag of tags) {
        if (recentText.includes(String(tag).toLowerCase())) score += 3;
      }
      if (c.title && recentText.includes(c.title.toLowerCase())) score += 2;
      if (c.shortcut && recentText.includes(c.shortcut.replace('/', '').toLowerCase())) score += 2;
      score += Math.min((c.usage_count || c.usageCount || 0) / 100, 1.5);
      return { item: c, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
};

export const formatConversationLines = (messages = [], { includePrivateNotes = false, maxMessages = 20 } = {}) => {
  const filtered = messages.filter((m) => {
    const isPrivate = Boolean(m.is_private_note || m.isPrivateNote || m.sender === 'note');
    return includePrivateNotes ? true : !isPrivate;
  });

  const sliced = filtered.slice(-maxMessages);
  if (sliced.length === 0) return '(ยังไม่มีข้อความสนทนา)';

  return sliced
    .map((m) => {
      const time = m.time || '00:00';
      const isPrivate = Boolean(m.is_private_note || m.isPrivateNote || m.sender === 'note');
      let roleLabel = 'เจ้าหน้าที่';
      if (m.sender === 'customer') roleLabel = 'ลูกค้า';
      else if (isPrivate) roleLabel = `Private Note (${m.author_name || m.authorName || 'ทีมงาน'})`;
      else if (m.botSource && m.botSource !== 'human') roleLabel = 'บอท';

      const safeText = maskSensitiveData(m.text || '');
      return `[${time}] ${roleLabel}: ${safeText}`;
    })
    .join('\n');
};

export const buildAiPromptPayload = ({
  mode = 'suggest_reply', // 'suggest_reply' | 'summary'
  companyName = 'CusBox360',
  agentParticle = 'ค่ะ',
  customerContext = {},
  messages = [],
  cannedResponses = [],
}) => {
  const promptFilename = mode === 'summary' ? 'summary.md' : 'suggest_reply.md';
  const rawTemplate = readPromptFile(promptFilename);
  const knowledgeText = readPromptFile('knowledge.md');

  const [systemPart, userPart] = rawTemplate.split('---USER_MESSAGE---');

  const customerName = customerContext.name || customerContext.customerName || 'คุณลูกค้า';
  const customerFirstName = extractFirstName(customerName);
  const customerId = customerContext.id || customerContext.customerId || 'C00123';
  const customerType =
    customerContext.customerType === 'CORPORATE' || customerContext.type === 'B2B' ? 'B2B' : 'B2C';
  const tier = customerContext.tier || 'MEMBER';
  const lastOrders = maskSensitiveData(
    customerContext.lastOrdersText ||
      `${customerContext.lastOrderCode || 'SO-10482'}, สถานะ: กำลังจัดส่ง, เลขพัสดุ: ${customerContext.trackingNumber || 'TH2609-88412'}`
  );
  const openTickets = maskSensitiveData(
    customerContext.openTicketsText || 'ไม่มี Ticket ที่เปิดอยู่'
  );
  const consentLine = customerContext.consentLine === false ? 'no' : 'yes';

  const relevantCanned = selectRelevantCannedResponses(cannedResponses, messages, 7);
  const cannedText =
    relevantCanned.length > 0
      ? relevantCanned
          .map((c) => `${c.shortcut} | ${c.title} | ${maskSensitiveData(c.content)}`)
          .join('\n')
      : '(ไม่มีข้อความด่วนที่เกี่ยวข้อง)';

  const includePrivateNotes = mode === 'summary';
  const maxMessages = mode === 'summary' ? 50 : 20;
  const conversationHistory = formatConversationLines(messages, {
    includePrivateNotes,
    maxMessages,
  });

  const replaceTokens = (str) =>
    (str || '')
      .replace(/^#\s*System Prompt\s*/i, '')
      .replace(/\{company_name\}/g, companyName)
      .replace(/\{agent_particle\}/g, agentParticle)
      .replace(/\{customer_first_name\}/g, customerFirstName)
      .replace(/\{customer_id\}/g, customerId)
      .replace(/\{customer_name\}/g, maskSensitiveData(customerName))
      .replace(/\{customer_type\}/g, customerType)
      .replace(/\{tier\}/g, tier)
      .replace(/\{last_orders\}/g, lastOrders)
      .replace(/\{open_tickets\}/g, openTickets)
      .replace(/\{consent_line\}/g, consentLine)
      .replace(/\{conversation_history\}/g, conversationHistory)
      .replace(/\{canned_responses\}/g, cannedText)
      .replace(/\{knowledge\}/g, knowledgeText.trim())
      .trim();

  return {
    systemInstruction: replaceTokens(systemPart),
    userMessage: replaceTokens(userPart),
  };
};
