import { query } from '../../db.js';
import { getThaiTime } from '../utils/formatters.js';
import { fetchLineProfile, sendLineReply, sendLinePush } from '../services/lineService.js';
import { matchBotReply } from '../services/botEngineService.js';
import { recordWebhookDiagnostic } from '../services/lineWebhookDiagnostics.js';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

export const handleLineWebhook = async (req, res) => {
  const channelId = req.params.channelId || '2011580063';
  const tenantId = getCurrentTenantId();
  const events = Array.isArray(req.body?.events) ? req.body.events : [];

  console.log(`[LINE Webhook] Received ${events.length} event(s) for channel: ${channelId} (tenant: ${tenantId})`);

  if (events.length === 0) {
    recordWebhookDiagnostic({ status: 'ok', eventType: 'verify', incrementReceived: true });
    return res.status(200).json({ status: 'success', message: 'Webhook verified', channelId, receivedEvents: 0 });
  }

  for (const evt of events) {
    try {
      console.log(`[LINE Event] Type: ${evt.type}, Mode: ${evt.mode}, Source:`, evt.source);
      if (evt.type !== 'message' || evt.message?.type !== 'text') {
        recordWebhookDiagnostic({ status: 'ok', eventType: evt.type || 'other', incrementReceived: true });
        continue;
      }

      const userId = evt.source?.userId;
      const text = evt.message.text;
      const timeStr = getThaiTime();
      console.log(`📩 [LINE Incoming Message] From: ${userId}, Text: "${text}"`);

      const profile = await fetchLineProfile(userId);
      const customerName = profile?.displayName || 'ลูกค้า LINE (ใหม่)';
      const customerAvatar = profile?.pictureUrl || null;

      const existResult = await query(
        `SELECT * FROM conversations WHERE tenant_id = $1 AND (line_user_id = $2 OR customer_id = $2) LIMIT 1`,
        [tenantId, userId]
      );

      const newMsgId = `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let targetConvId = '';
      const isNew = existResult.rows.length === 0;

      if (!isNew) {
        const conv = existResult.rows[0];
        targetConvId = conv.id;
        await query(
          `INSERT INTO messages (tenant_id, id, conversation_id, sender, text, time) VALUES ($1,$2,$3,'customer',$4,$5)`,
          [tenantId, newMsgId, conv.id, text, timeStr]
        );
        await query(
          `UPDATE conversations SET
            last_message_preview = $1, time = $2, unread_count = unread_count + 1, status = 'Open',
            customer_name = COALESCE($3, customer_name), customer_avatar = COALESCE($4, customer_avatar),
            last_reply_token = $5, last_reply_token_time = NOW(), updated_at = NOW()
           WHERE tenant_id = $6 AND id = $7`,
          [text, timeStr, profile?.displayName || null, profile?.pictureUrl || null, evt.replyToken || null, tenantId, conv.id]
        );
      } else {
        const convId = `conv-line-${userId ? userId.slice(-6) : Date.now()}`;
        targetConvId = convId;
        const custId = userId || `C-LINE-${Date.now()}`;
        await query(
          `INSERT INTO conversations (tenant_id, id, customer_id, customer_name, customer_avatar, customer_tier, channel, channel_account, time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group, line_user_id, last_reply_token, last_reply_token_time)
           VALUES ($1,$2,$3,$4,$5,'MEMBER','LINE','cb360 Official',$6,$7,'LINE Live',1,'Open','วิภา ส.','Customer Care','Mine',$8,$9,NOW())`,
          [tenantId, convId, custId, customerName, customerAvatar, timeStr, text, userId, evt.replyToken || null]
        );
        await query(
          `INSERT INTO messages (tenant_id, id, conversation_id, sender, text, time) VALUES ($1,$2,$3,'customer',$4,$5)`,
          [tenantId, newMsgId, convId, text, timeStr]
        );
      }

      let isBotActiveForConv = isNew ? true : existResult.rows[0]?.is_bot_active !== false;
      const cleanLower = text.trim().toLowerCase();
      const isGreeting = ['สวัสดี', 'หวัดดี', 'ดีครับ', 'ดีค่ะ', 'hello', 'hi', 'hey'].some((g) => cleanLower.includes(g));
      if (!isBotActiveForConv && isGreeting) {
        isBotActiveForConv = true;
        await query(`UPDATE conversations SET is_bot_active = TRUE WHERE tenant_id = $1 AND id = $2`, [tenantId, targetConvId]);
      }

      if (!isBotActiveForConv) {
        recordWebhookDiagnostic({ status: 'ok', eventType: 'message:bot_paused', incrementReceived: true });
        continue;
      }

      let recentMessages = [];
      try {
        const recentRes = await query(
          `SELECT sender, text FROM messages WHERE tenant_id = $1 AND conversation_id = $2 ORDER BY created_at DESC LIMIT 6`,
          [tenantId, targetConvId]
        );
        recentMessages = (recentRes.rows || []).reverse();
      } catch (fetchMsgErr) {
        console.warn('[Fetch Recent Messages Warning]:', fetchMsgErr.message);
      }

      const botReply = await matchBotReply(text, isNew, customerName, recentMessages);
      if (botReply && botReply.replyText) {
        const botMsgId = `m-bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const botTimeStr = getThaiTime();
        const authorTag = botReply.isAi ? '🤖 CusBox AI (Gemini)' : '🤖 CusBox Bot (Auto-Reply)';

        let lineDelivered = false;
        let lineErrMsg = null;

        if (evt.replyToken) {
          lineDelivered = await sendLineReply(evt.replyToken, botReply.replyText);
          if (!lineDelivered && userId) {
            const pushRes = await sendLinePush(userId, botReply.replyText);
            lineDelivered = pushRes.success;
            if (!lineDelivered) lineErrMsg = pushRes.error;
          }
        } else if (userId) {
          const pushRes = await sendLinePush(userId, botReply.replyText);
          lineDelivered = pushRes.success;
          if (!lineDelivered) lineErrMsg = pushRes.error;
        }

        const deliveryStatus = lineDelivered ? 'delivered' : 'failed';
        await query(
          `INSERT INTO messages (tenant_id, id, conversation_id, sender, author_name, text, time, delivery_status, failure_reason)
           VALUES ($1,$2,$3,'agent',$4,$5,$6,$7,$8)`,
          [tenantId, botMsgId, targetConvId, authorTag, botReply.replyText, botTimeStr, deliveryStatus, lineErrMsg]
        );
        await query(
          `UPDATE conversations SET last_message_preview = $1, time = $2, updated_at = NOW() WHERE tenant_id = $3 AND id = $4`,
          [botReply.replyText, botTimeStr, tenantId, targetConvId]
        );

        recordWebhookDiagnostic({
          status: lineDelivered ? 'ok' : 'reply_failed',
          eventType: `message:${botReply.type || 'reply'}`,
          error: lineErrMsg,
          incrementReceived: true,
        });
      } else {
        recordWebhookDiagnostic({ status: 'ok', eventType: 'message:no_reply', incrementReceived: true });
      }
    } catch (evtErr) {
      console.error('[LINE Webhook Event Processing Error]:', evtErr.message);
      recordWebhookDiagnostic({
        status: 'db_error',
        eventType: evt?.type || 'error',
        error: evtErr.message,
        incrementReceived: true,
      });
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Webhook processed successfully',
    channelId,
    receivedEvents: events.length,
  });
};

export const handleMetaGet = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) return res.status(200).send(challenge);
  return res.status(200).send('Meta Webhook Endpoint Active');
};
