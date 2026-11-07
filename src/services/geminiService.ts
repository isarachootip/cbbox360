/**
 * geminiService.ts
 * Calls Google Gemini API to generate an AI reply for customer chat.
 * Context includes: chat history, customer CDP data, company profile & KM, and canned responses KB.
 */

import {
  ChatMessage,
  Customer,
  CannedResponse,
  CompanyProfile,
  KnowledgeItem,
} from '../types';
import { formatKnowledgeForPrompt } from '../domain/templates/knowledgeMerge';
import { defaultCompanyProfile, defaultKnowledgeItems } from '../data/templateKnowledgePresets';

export interface GeminiReplyContext {
  botName: string;
  chatHistory: ChatMessage[];
  customer: Pick<Customer, 'name' | 'tier' | 'phone' | 'lastOrderCode'> | null;
  cannedResponses: CannedResponse[];
  companyProfile?: CompanyProfile;
  knowledgeItems?: KnowledgeItem[];
  apiKey: string;
}

export interface GeminiReplyResult {
  success: boolean;
  text: string;
  error?: string;
}

/** Build a concise system prompt incorporating business knowledge and company profile. */
export function buildSystemPrompt(
  botName: string,
  customer: GeminiReplyContext['customer'],
  cannedResponses: CannedResponse[],
  companyProfile: CompanyProfile = defaultCompanyProfile,
  knowledgeItems: KnowledgeItem[] = defaultKnowledgeItems
): string {
  const companyAndKmText = formatKnowledgeForPrompt(companyProfile, knowledgeItems);

  const cannedKb = cannedResponses
    .filter((cr) => cr.isActive)
    .slice(0, 15)
    .map((cr) => `- ${cr.title}: ${cr.content.slice(0, 200)}`)
    .join('\n');

  const customerInfo = customer
    ? `ชื่อลูกค้า: ${customer.name}, ระดับ: ${customer.tier}, โทร: ${customer.phone || 'ไม่ระบุ'}, คำสั่งซื้อล่าสุด: ${customer.lastOrderCode || 'ไม่มี'}`
    : 'ไม่ทราบข้อมูลลูกค้า';

  return [
    `คุณคือ ${botName} ผู้ช่วยฝ่ายบริการลูกค้าของ ${companyProfile.companyName}.`,
    `ตอบภาษาไทยด้วยน้ำเสียงสุภาพ กระชับ และเป็นมิตร ไม่เกิน 3-4 ประโยค`,
    `ข้อมูลลูกค้าปัจจุบัน: ${customerInfo}`,
    companyAndKmText,
    `ข้อความตอบกลับมาตรฐาน (Canned Responses):\n${cannedKb || 'ไม่มีข้อมูลเพิ่มเติม'}`,
    `หากลูกค้าถามชื่อบริษัท ทำธุรกิจอะไร เบอร์โทร อีเมล หรือที่อยู่ ให้ตอบตามข้อมูลบริษัทด้านบนอย่างชัดเจน`,
    `ถ้าไม่แน่ใจคำตอบ ให้บอกว่าจะส่งเรื่องให้เจ้าหน้าที่ดูแล ห้ามแต่งข้อมูล`,
  ].join('\n\n');
}

/** Build conversation turns from chat history (last 20 messages). */
function buildChatTurns(
  history: ChatMessage[]
): Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> {
  return history
    .slice(-20)
    .filter((m) => !m.isPrivateNote && !m.task)
    .map((m) => ({
      role: m.sender === 'customer' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
}

/**
 * callGemini — Main function to get AI reply.
 * Falls back gracefully if API key is missing or network fails.
 */
export async function callGemini(ctx: GeminiReplyContext): Promise<GeminiReplyResult> {
  if (!ctx.apiKey) {
    return { success: false, text: '', error: 'Gemini API Key ยังไม่ได้ตั้งค่า' };
  }

  const systemPrompt = buildSystemPrompt(
    ctx.botName,
    ctx.customer,
    ctx.cannedResponses,
    ctx.companyProfile ?? defaultCompanyProfile,
    ctx.knowledgeItems ?? defaultKnowledgeItems
  );
  const turns = buildChatTurns(ctx.chatHistory);

  // Gemini requires at least one user turn at the end
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return { success: false, text: '', error: 'ไม่พบข้อความจากลูกค้าที่ต้องตอบ' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ctx.apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: turns,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, text: '', error: `Gemini API Error ${res.status}: ${errBody.slice(0, 200)}` };
    }

    const json = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'ขออภัย ระบบไม่สามารถสร้างคำตอบได้ในขณะนี้ค่ะ';

    return { success: true, text: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, text: '', error: `Network error: ${message}` };
  }
}
