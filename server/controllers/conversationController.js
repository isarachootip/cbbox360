import { query } from '../../db.js';
import { getThaiTime } from '../utils/formatters.js';
import { sendLinePush, sendLineReply } from '../services/lineService.js';
import { getBotSettings } from '../services/botEngineService.js';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';
import { conversationRepository, createInMemoryConversationStore } from '../repositories/conversationRepository.js';
import { applyTemplateSeedContacts } from '../../core/server/template-engine/templateSeedLoader.js';

export { createInMemoryConversationStore };

export const createConversationHandlers = ({ store = conversationRepository } = {}) => ({
  getConversations: async (req, res) => {
    try {
      const tenantId = getCurrentTenantId();
      let data = await store.listByTenant(tenantId);
      if (data.length === 0 && req?.tenant?.templateId && tenantId !== 'default') {
        await applyTemplateSeedContacts({
          tenantId,
          templateId: req.tenant.templateId,
          convStore: store,
        });
        data = await store.listByTenant(tenantId);
      }
      return res.status(200).json({ status: 'success', data, count: data.length });
    } catch (err) {
      console.error('[GET /api/conversations Error]:', err.message);
      return res.status(500).json({ error: 'Database error', detail: err.message });
    }
  },
});

export const getConversations = createConversationHandlers().getConversations;

export const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { text, isPrivate, authorName } = req.body;
  const tenantId = getCurrentTenantId();

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const convResult = await query(
      `SELECT * FROM conversations WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id]
    );
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conv = convResult.rows[0];

    const timeStr = getThaiTime();
    const newMsgId = `m-${Date.now()}`;
    const sender = isPrivate ? 'note' : 'agent';
    const author = authorName || 'วิภา ส.';

    let lineDelivery = { success: true };
    let deliveryStatus = 'delivered';
    let failureReason = null;

    if (!isPrivate && conv.channel === 'LINE') {
      if (!conv.line_user_id) {
        failureReason = 'ห้องแชทนี้ยังไม่ได้ระบุ LINE User ID (ไม่สามารถส่งข้อความเข้า LINE ได้)';
        lineDelivery = { success: false, error: failureReason };
        deliveryStatus = 'failed';
      } else {
        let replySuccess = false;
        const nowMs = Date.now();
        const tokenTime = conv.last_reply_token_time ? new Date(conv.last_reply_token_time).getTime() : 0;
        const isReplyTokenFresh = conv.last_reply_token && nowMs - tokenTime < 50000;

        if (isReplyTokenFresh) {
          replySuccess = await sendLineReply(conv.last_reply_token, text.trim());
          if (replySuccess) {
            lineDelivery = { success: true, method: 'reply' };
            await query(`UPDATE conversations SET last_reply_token = NULL WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
          }
        }

        if (!replySuccess) {
          lineDelivery = await sendLinePush(conv.line_user_id, text.trim());
          if (!lineDelivery || !lineDelivery.success) {
            deliveryStatus = 'failed';
            failureReason = lineDelivery?.error || 'LINE Push delivery failed';
          }
        }
      }
    }

    await query(
      `INSERT INTO messages (tenant_id, id, conversation_id, sender, author_name, text, time, is_private_note, delivery_status, failure_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [tenantId, newMsgId, id, sender, author, text.trim(), timeStr, !!isPrivate, deliveryStatus, failureReason]
    );

    const shouldPauseBot = getBotSettings()?.pauseBotOnAgentReply !== false;
    const nextBotActive = isPrivate
      ? conv.is_bot_active !== false
      : shouldPauseBot
      ? false
      : conv.is_bot_active !== false;

    if (!isPrivate) {
      if (shouldPauseBot) {
        await query(
          `UPDATE conversations SET last_message_preview=$1, time=$2, is_bot_active=FALSE, updated_at=NOW() WHERE tenant_id=$3 AND id=$4`,
          [text.trim(), timeStr, tenantId, id]
        );
      } else {
        await query(
          `UPDATE conversations SET last_message_preview=$1, time=$2, updated_at=NOW() WHERE tenant_id=$3 AND id=$4`,
          [text.trim(), timeStr, tenantId, id]
        );
      }
    }

    return res.status(200).json({
      status: 'success',
      message: {
        id: newMsgId,
        sender,
        authorName: author,
        text: text.trim(),
        time: timeStr,
        isPrivateNote: !!isPrivate,
        deliveryStatus,
        failureReason,
      },
      lineDelivery,
      isBotActive: nextBotActive,
    });
  } catch (err) {
    console.error('[POST messages Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const toggleBotStatus = async (req, res) => {
  const { id } = req.params;
  const { isBotActive } = req.body;
  const tenantId = getCurrentTenantId();

  if (typeof isBotActive !== 'boolean') {
    return res.status(400).json({ error: 'isBotActive boolean is required' });
  }

  try {
    const result = await query(
      `UPDATE conversations SET is_bot_active = $1, updated_at = NOW() WHERE tenant_id = $2 AND id = $3 RETURNING *`,
      [isBotActive, tenantId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    return res.status(200).json({
      status: 'success',
      isBotActive: result.rows[0].is_bot_active,
      message: `Bot status updated to ${isBotActive ? 'Active' : 'Paused'}`,
    });
  } catch (err) {
    console.error('[PATCH bot-status Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const updateLineUserId = async (req, res) => {
  const { id } = req.params;
  const { lineUserId } = req.body;
  const tenantId = getCurrentTenantId();

  if (!lineUserId || !lineUserId.trim()) {
    return res.status(400).json({ error: 'lineUserId string is required' });
  }

  try {
    const result = await query(
      `UPDATE conversations SET line_user_id = $1, updated_at = NOW() WHERE tenant_id = $2 AND id = $3 RETURNING *`,
      [lineUserId.trim(), tenantId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    return res.status(200).json({
      status: 'success',
      lineUserId: result.rows[0].line_user_id,
      message: 'LINE User ID updated successfully',
    });
  } catch (err) {
    console.error('[PATCH line-user Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};
