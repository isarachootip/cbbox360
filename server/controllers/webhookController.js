import { query } from '../../db.js';
import { getThaiTime } from '../utils/formatters.js';
import { fetchLineProfile, sendLineReply, sendLinePush } from '../services/lineService.js';
import { matchBotReply } from '../services/botEngineService.js';

export const handleLineWebhook = async (req, res) => {
  const channelId = req.params.channelId || '2011580063';
  const events = req.body?.events || [];

  console.log(`[LINE Webhook] Received ${events.length} event(s) for channel: ${channelId}`);

  for (const evt of events) {
    console.log(`[LINE Event] Type: ${evt.type}, Mode: ${evt.mode}, Source:`, evt.source);

    if (evt.type === 'message' && evt.message?.type === 'text') {
      const userId = evt.source?.userId;
      const text = evt.message.text;
      const timeStr = getThaiTime();

      console.log(`📩 [LINE Incoming Message] From: ${userId}, Text: "${text}"`);

      const profile = await fetchLineProfile(userId);
      const customerName = profile?.displayName || 'ลูกค้า LINE (ใหม่)';
      const customerAvatar = profile?.pictureUrl || null;

      // Find existing conversation
      const existResult = await query(
        `SELECT * FROM conversations WHERE line_user_id = $1 OR customer_id = $1 LIMIT 1`,
        [userId]
      );

      const newMsgId = `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let targetConvId = '';
      const isNew = existResult.rows.length === 0;

      if (!isNew) {
        const conv = existResult.rows[0];
        targetConvId = conv.id;

        // Insert new message
        await query(
          `INSERT INTO messages (id, conversation_id, sender, text, time) VALUES ($1,$2,'customer',$3,$4)`,
          [newMsgId, conv.id, text, timeStr]
        );

        // Update conversation with last_reply_token
        await query(
          `UPDATE conversations SET
            last_message_preview = $1,
            time = $2,
            unread_count = unread_count + 1,
            status = 'Open',
            customer_name = COALESCE($3, customer_name),
            customer_avatar = COALESCE($4, customer_avatar),
            last_reply_token = $5,
            last_reply_token_time = NOW(),
            updated_at = NOW()
           WHERE id = $6`,
          [text, timeStr, profile?.displayName || null, profile?.pictureUrl || null, evt.replyToken || null, conv.id]
        );
      } else {
        // New conversation
        const convId = `conv-line-${userId ? userId.slice(-6) : Date.now()}`;
        targetConvId = convId;
        const custId = userId || `C-LINE-${Date.now()}`;

        await query(
          `INSERT INTO conversations (id, customer_id, customer_name, customer_avatar, customer_tier, channel, channel_account, time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group, line_user_id, last_reply_token, last_reply_token_time)
           VALUES ($1,$2,$3,$4,'MEMBER','LINE','cb360 Official',$5,$6,'LINE Live',1,'Open','วิภา ส.','Customer Care','Mine',$7,$8,NOW())`,
          [convId, custId, customerName, customerAvatar, timeStr, text, userId, evt.replyToken || null]
        );

        await query(
          `INSERT INTO messages (id, conversation_id, sender, text, time) VALUES ($1,$2,'customer',$3,$4)`,
          [newMsgId, convId, text, timeStr]
        );
      }

      // Check Bot Auto-Reply & Smart Auto-Resume
      let isBotActiveForConv = isNew ? true : existResult.rows[0]?.is_bot_active !== false;

      // Smart Auto-Resume: If customer sends a greeting, resume bot automatically
      const cleanLower = text.trim().toLowerCase();
      const isGreeting = ['สวัสดี', 'หวัดดี', 'ดีครับ', 'ดีค่ะ', 'hello', 'hi', 'hey'].some((g) => cleanLower.includes(g));
      if (!isBotActiveForConv && isGreeting) {
        isBotActiveForConv = true;
        await query(`UPDATE conversations SET is_bot_active = TRUE WHERE id = $1`, [targetConvId]);
        console.log(`🤖 [Smart Auto-Resume]: Resumed bot for conversation ${targetConvId} due to greeting keyword`);
      }

      if (!isBotActiveForConv) {
        console.log(`🤖 [Bot Paused]: Skipping auto-reply for conversation ${targetConvId} (Agent active)`);
      } else {
        try {
          // Fetch last 6 recent messages to provide grounding context for AI
          let recentMessages = [];
          try {
            const recentRes = await query(
              `SELECT sender, text FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 6`,
              [targetConvId]
            );
            recentMessages = (recentRes.rows || []).reverse();
          } catch (fetchMsgErr) {
            console.warn('[Fetch Recent Messages Warning]:', fetchMsgErr.message);
          }

          const botReply = await matchBotReply(text, isNew, customerName, recentMessages);
          if (botReply && botReply.replyText) {
            const botMsgId = `m-bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const botTimeStr = getThaiTime();
            const authorTag = botReply.isAi
              ? '🤖 CusBox AI (Gemini)'
              : '🤖 CusBox Bot (Auto-Reply)';

            // Send to LINE first to verify delivery
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

            // Store bot reply in DB
            await query(
              `INSERT INTO messages (id, conversation_id, sender, author_name, text, time, delivery_status, failure_reason)
               VALUES ($1,$2,'agent',$3,$4,$5,$6,$7)`,
              [botMsgId, targetConvId, authorTag, botReply.replyText, botTimeStr, deliveryStatus, lineErrMsg]
            );

            // Update conversation preview
            await query(
              `UPDATE conversations SET last_message_preview = $1, time = $2, updated_at = NOW() WHERE id = $3`,
              [botReply.replyText, botTimeStr, targetConvId]
            );
          }
        } catch (botErr) {
          console.error('[Bot Auto-Reply Execution Error]:', botErr.message);
        }
      }
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
