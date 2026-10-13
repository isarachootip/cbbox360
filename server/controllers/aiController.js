import { query } from '../../db.js';
import { getBotSettings } from '../services/botEngineService.js';
import { buildAiPromptPayload } from '../utils/promptBuilder.js';
import {
  parseAndValidateSuggestReply,
  parseAndValidateSummary,
} from '../utils/aiSchemaValidator.js';
import {
  callGeminiStructured,
  buildSmartLocalSuggestReply,
  buildSmartLocalSummary,
} from '../services/aiAssistantService.js';
import {
  SERVER_CUSTOMER_PROFILES,
  SERVER_CONV_FALLBACKS,
  inferAgentParticle,
} from '../services/aiCustomerFallback.js';

// In-memory cache & telemetry fallback when DB is unavailable
const memorySummaryCache = new Map();
const memoryUsageLogs = [];

const loadConversationData = async (conversationId, body = {}) => {
  let conv = SERVER_CONV_FALLBACKS[conversationId] || null;
  let messages = Array.isArray(body.messages) ? body.messages : null;
  let cannedResponses = Array.isArray(body.cannedResponses) ? body.cannedResponses : [];

  try {
    const convRes = await query('SELECT * FROM conversations WHERE id = $1 LIMIT 1', [conversationId]);
    if (convRes.rows.length > 0) {
      const row = convRes.rows[0];
      conv = {
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerTier: row.customer_tier,
        assignedTo: row.assigned_to,
      };
    }

    if (!messages) {
      const msgRes = await query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC',
        [conversationId]
      );
      if (msgRes.rows.length > 0) {
        messages = msgRes.rows;
      }
    }

    if (cannedResponses.length === 0) {
      const crRes = await query('SELECT * FROM canned_responses WHERE is_active = true');
      cannedResponses = crRes.rows;
    }
  } catch (_dbErr) {
    // Fallback to in-memory/body data
  }

  if (!messages) {
    messages = conv?.messages || [];
  }

  const fallbackProfile =
    SERVER_CUSTOMER_PROFILES[body.customerContext?.id || conv?.customerId || 'C00123'] ||
    SERVER_CUSTOMER_PROFILES.C00123;

  const customerContext = {
    ...fallbackProfile,
    ...(conv
      ? {
          id: conv.customerId || fallbackProfile.id,
          name: conv.customerName || fallbackProfile.name,
          tier: conv.customerTier || fallbackProfile.tier,
        }
      : {}),
    ...(body.customerContext || {}),
  };

  return { conv, messages, cannedResponses, customerContext };
};

const recordAiUsageLog = async (entry) => {
  memoryUsageLogs.unshift(entry);
  try {
    await query(
      `INSERT INTO ai_usage_logs (id, user_id, conversation_id, feature, response_time_ms, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        entry.id,
        entry.userId,
        entry.conversationId,
        entry.feature,
        entry.responseTimeMs,
        entry.status,
      ]
    );
  } catch (_err) {
    // Keep in memoryUsageLogs
  }
};

export const postSuggestReply = async (req, res) => {
  const startTime = Date.now();
  const { conversationId, agentName, agentParticle, userId } = req.body || {};
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  const botSettings = getBotSettings();
  if (botSettings.aiSuggestReplyEnabled === false) {
    return res.status(403).json({ error: 'ฟีเจอร์แนะนำคำตอบ (Suggested Reply) ถูกปิดใช้งานในหน้าตั้งค่า' });
  }

  const { conv, messages, cannedResponses, customerContext } = await loadConversationData(
    conversationId,
    req.body
  );
  const particle = agentParticle || inferAgentParticle(agentName || conv?.assignedTo || '');
  const companyName = botSettings.companyName || 'CusBox360';

  const { systemInstruction, userMessage } = buildAiPromptPayload({
    mode: 'suggest_reply',
    companyName,
    agentParticle: particle,
    customerContext,
    messages,
    cannedResponses,
  });

  const apiKey = botSettings.geminiApiKey || process.env.GEMINI_API_KEY;
  let resultData = null;
  let status = 'success';

  if (apiKey) {
    const aiOut = await callGeminiStructured({
      systemInstruction,
      userMessage,
      temperature: 0.4,
      apiKey,
      validatorFn: parseAndValidateSuggestReply,
      timeoutMs: 15000,
    });
    if (!aiOut.ok) {
      await recordAiUsageLog({
        id: `ailog-${Date.now()}`,
        userId: userId || agentName || 'agent',
        conversationId,
        feature: 'suggest_reply',
        responseTimeMs: Date.now() - startTime,
        status: 'error',
      });
      return res.status(502).json({ error: aiOut.error });
    }
    resultData = aiOut.data;
  } else {
    resultData = buildSmartLocalSuggestReply({
      customerContext,
      messages,
      agentParticle: particle,
    });
    status = 'fallback_local';
  }

  const logId = `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await recordAiUsageLog({
    id: logId,
    userId: userId || agentName || conv?.assignedTo || 'agent',
    conversationId,
    feature: 'suggest_reply',
    responseTimeMs: Date.now() - startTime,
    status,
  });

  return res.status(200).json({ ...resultData, logId });
};

export const postAiSummary = async (req, res) => {
  const startTime = Date.now();
  const { conversationId, forceRefresh = false, userId, agentName } = req.body || {};
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  const botSettings = getBotSettings();
  if (botSettings.aiSummaryEnabled === false) {
    return res.status(403).json({ error: 'ฟีเจอร์สรุปบทสนทนา (AI Summary) ถูกปิดใช้งานในหน้าตั้งค่า' });
  }

  const { messages, cannedResponses, customerContext } = await loadConversationData(
    conversationId,
    req.body
  );
  const currentMsgCount = messages.length;

  // Check cached summary if message_count hasn't changed
  if (!forceRefresh) {
    try {
      const cacheRes = await query(
        'SELECT message_count, result, created_at FROM ai_summaries WHERE conversation_id = $1 LIMIT 1',
        [conversationId]
      );
      if (cacheRes.rows.length > 0 && cacheRes.rows[0].message_count === currentMsgCount) {
        return res.status(200).json({
          ...cacheRes.rows[0].result,
          cached: true,
          messageCount: currentMsgCount,
          updatedAt: cacheRes.rows[0].created_at,
        });
      }
    } catch (_err) {
      const memCached = memorySummaryCache.get(conversationId);
      if (memCached && memCached.messageCount === currentMsgCount) {
        return res.status(200).json({ ...memCached.result, cached: true, messageCount: currentMsgCount });
      }
    }
  }

  const { systemInstruction, userMessage } = buildAiPromptPayload({
    mode: 'summary',
    companyName: botSettings.companyName || 'CusBox360',
    agentParticle: 'ค่ะ',
    customerContext,
    messages,
    cannedResponses,
  });

  const apiKey = botSettings.geminiApiKey || process.env.GEMINI_API_KEY;
  let summaryData = null;
  let status = 'success';

  if (apiKey) {
    const aiOut = await callGeminiStructured({
      systemInstruction,
      userMessage,
      temperature: 0.2,
      apiKey,
      validatorFn: parseAndValidateSummary,
      timeoutMs: 15000,
    });
    if (!aiOut.ok) {
      await recordAiUsageLog({
        id: `ailog-${Date.now()}`,
        userId: userId || agentName || 'agent',
        conversationId,
        feature: 'summary',
        responseTimeMs: Date.now() - startTime,
        status: 'error',
      });
      return res.status(502).json({ error: aiOut.error });
    }
    summaryData = aiOut.data;
  } else {
    summaryData = buildSmartLocalSummary({ customerContext, messages });
    status = 'fallback_local';
  }

  // Save to ai_summaries
  memorySummaryCache.set(conversationId, { messageCount: currentMsgCount, result: summaryData });
  try {
    await query(
      `INSERT INTO ai_summaries (conversation_id, message_count, result, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (conversation_id)
       DO UPDATE SET message_count = $2, result = $3, created_at = NOW()`,
      [conversationId, currentMsgCount, JSON.stringify(summaryData)]
    );
  } catch (_err) {
    // Stored in memorySummaryCache
  }

  const logId = `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await recordAiUsageLog({
    id: logId,
    userId: userId || agentName || 'agent',
    conversationId,
    feature: 'summary',
    responseTimeMs: Date.now() - startTime,
    status,
  });

  return res.status(200).json({
    ...summaryData,
    cached: false,
    messageCount: currentMsgCount,
    logId,
  });
};

export const patchAiUsageLog = async (req, res) => {
  const { id } = req.params;
  const { selectedLabel, selectedText, finalSentText, wasEdited } = req.body || {};

  const memItem = memoryUsageLogs.find((l) => l.id === id);
  if (memItem) {
    if (selectedLabel !== undefined) memItem.selectedLabel = selectedLabel;
    if (selectedText !== undefined) memItem.selectedText = selectedText;
    if (finalSentText !== undefined) memItem.finalSentText = finalSentText;
    if (wasEdited !== undefined) memItem.wasEdited = wasEdited;
  }

  try {
    await query(
      `UPDATE ai_usage_logs
       SET selected_label = COALESCE($2, selected_label),
           selected_text = COALESCE($3, selected_text),
           final_sent_text = COALESCE($4, final_sent_text),
           was_edited = COALESCE($5, was_edited)
       WHERE id = $1`,
      [id, selectedLabel ?? null, selectedText ?? null, finalSentText ?? null, wasEdited ?? null]
    );
  } catch (_err) {
    // Updated in memory
  }

  return res.status(200).json({ status: 'ok', id });
};

export const getAiUsageMetrics = async (_req, res) => {
  try {
    const dbRes = await query('SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 200');
    return res.status(200).json({ logs: dbRes.rows });
  } catch (_err) {
    return res.status(200).json({ logs: memoryUsageLogs.slice(0, 200) });
  }
};
