import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const LINE_CHANNEL_ACCESS_TOKEN =
  process.env.LINE_CHANNEL_ACCESS_TOKEN ||
  'G6HhxgQDo/1Ji4LOomrfk8Eh4yhBn74w0i+T2vXPjdA2/8bRXZCtvXF9hSwFpjM0MKhTYasa+K/CKZjamIj9JhvqhXCKJXtH/I2YjgGpTkZgwNweMhhOe0GcuLKArE8W1B4tn68xsWeRD/0WY1cpowdB04t89/1O/w1cDnyilFU=';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// ================= Helpers =================
const getThaiTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

const fetchLineProfile = async (userId) => {
  if (!userId || !LINE_CHANNEL_ACCESS_TOKEN) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('[LINE Profile Fetch Error]:', err.message);
  }
  return null;
};

/** Convert DB row (snake_case) → frontend object (camelCase) */
const rowToConversation = (row, messages = []) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerAvatar: row.customer_avatar,
  customerTier: row.customer_tier,
  channel: row.channel,
  channelAccount: row.channel_account,
  time: row.time,
  lastMessagePreview: row.last_message_preview,
  label: row.label,
  unreadCount: row.unread_count,
  status: row.status,
  assignedTo: row.assigned_to,
  team: row.team,
  tabGroup: row.tab_group,
  lineUserId: row.line_user_id,
  messages,
});

const rowToMessage = (row) => ({
  id: row.id,
  sender: row.sender,
  authorName: row.author_name,
  text: row.text,
  time: row.time,
  trackingNumber: row.tracking_number,
  isPrivateNote: row.is_private_note,
});

// ================= Bot Auto-Reply Settings & Engine =================
let botSettings = {
  isEnabled: true,
  botName: 'CusBox AI Assistant',
  operatingMode: 'always',
  welcomeMessageEnabled: true,
  welcomeCannedResponseId: 'cr-1',
  offHoursMessageEnabled: true,
  offHoursText:
    'สวัสดีค่ะ ขณะนี้นอกเวลาทำการของศูนย์บริการ CusBox360 (เวลาทำการ จ.-ศ. 08:30 - 18:00 น.) คุณลูกค้าสามารถฝากข้อความหรือคำถามไว้ได้เลยนะคะ เจ้าหน้าที่จะรีบติดต่อกลับในเวลาทำการค่ะ 🙏',
  businessHours: {
    start: '08:30',
    end: '18:00',
    workdays: [1, 2, 3, 4, 5, 6],
  },
  humanHandoffEnabled: true,
  humanHandoffKeywords: [
    'ติดต่อเจ้าหน้าที่', 'คุยกับคน', 'พนักงาน', 'แอดมิน', 'คุยกับแอดมิน', 'ขอคุยกับคน', 'ติดต่อพนักงาน', 'agent', 'human'
  ],
  handoffMessage:
    'ระบบได้ส่งเรื่องให้เจ้าหน้าที่ฝ่ายบริการลูกค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะเข้ามาดูแลและตอบกลับแชทนี้โดยเร็วที่สุดนะคะ กรุณารอสักครู่ค่ะ 👩‍💼',
  rules: [
    {
      id: 'rule-bank',
      name: 'แจ้งช่องทางชำระเงินและเลขบัญชี',
      triggerType: 'keyword',
      keywords: ['เลขบัญชี', 'โอนเงิน', 'ชำระเงิน', 'จ่ายเงิน', 'ช่องทางชำระ', 'เลขที่บัญชี', 'โอนที่ไหน', 'บัญชี'],
      matchType: 'contains',
      cannedResponseId: 'cr-10',
      isActive: true,
      priority: 1,
    },
    {
      id: 'rule-tracking',
      name: 'แจ้งเลขพัสดุและติดตามจัดส่ง',
      triggerType: 'keyword',
      keywords: ['เลขพัสดุ', 'พัสดุ', 'ส่งของหรือยัง', 'ส่งของยัง', 'เช็คพัสดุ', 'track', 'tracking', 'ตามของ'],
      matchType: 'contains',
      cannedResponseId: 'cr-11',
      isActive: true,
      priority: 2,
    },
    {
      id: 'rule-delivery-time',
      name: 'รอบจัดส่งสินค้าและการตัดรอบ',
      triggerType: 'keyword',
      keywords: ['รอบส่ง', 'ตัดรอบ', 'ส่งวันไหน', 'ส่งกี่โมง', 'กี่วันถึง', 'ได้รับเมื่อไหร่', 'รอบจัดส่ง'],
      matchType: 'contains',
      cannedResponseId: 'cr-12',
      isActive: true,
      priority: 3,
    },
    {
      id: 'rule-slip',
      name: 'ขอสลิปหลักฐานการโอนเงิน',
      triggerType: 'keyword',
      keywords: ['โอนแล้ว', 'ส่งสลิป', 'แนบสลิป', 'จ่ายแล้ว', 'โอนเงินเรียบร้อย'],
      matchType: 'contains',
      cannedResponseId: 'cr-6',
      isActive: true,
      priority: 4,
    },
    {
      id: 'rule-hours',
      name: 'สอบถามเวลาทำการและที่ตั้ง',
      triggerType: 'keyword',
      keywords: ['เปิดกี่โมง', 'ปิดกี่โมง', 'เวลาทำการ', 'เปิดวันไหน', 'เบอร์ติดต่อ', 'สำนักงาน'],
      matchType: 'contains',
      cannedResponseId: 'cr-13',
      isActive: true,
      priority: 5,
    },
    {
      id: 'rule-warranty',
      name: 'ประกันสินค้าและเงื่อนไขเปลี่ยนคืน',
      triggerType: 'keyword',
      keywords: ['เคลม', 'ประกัน', 'สินค้าชำรุด', 'เปลี่ยนสินค้า', 'พัง', 'มีประกันไหม', 'สินค้าเสีย', 'ส่งซ่อม'],
      matchType: 'contains',
      cannedResponseId: 'cr-14',
      isActive: true,
      priority: 6,
    },
    {
      id: 'rule-tax',
      name: 'ขอใบกำกับภาษีและใบเสร็จรับเงิน',
      triggerType: 'keyword',
      keywords: ['ใบกำกับภาษี', 'ใบเสร็จ', 'tax id', 'ออกบิล', 'ขอใบกำกับ', 'ภพ20', 'หัก ณ ที่จ่าย'],
      matchType: 'contains',
      cannedResponseId: 'cr-9',
      isActive: true,
      priority: 7,
    },
    {
      id: 'rule-credit',
      name: 'เงื่อนไขการขอเครดิตเทอม',
      triggerType: 'keyword',
      keywords: ['เครดิต', 'credit term', 'วงเงินเครดิต', 'ขอเครดิต', 'ขอผ่อน', 'วางบิล'],
      matchType: 'contains',
      cannedResponseId: 'cr-15',
      isActive: true,
      priority: 8,
    },
    {
      id: 'rule-address',
      name: 'ขอที่อยู่และเบอร์โทรจัดส่ง',
      triggerType: 'keyword',
      keywords: ['ส่งที่ไหน', 'แก้ที่อยู่', 'เปลี่ยนที่อยู่', 'ที่อยู่จัดส่ง'],
      matchType: 'contains',
      cannedResponseId: 'cr-5',
      isActive: true,
      priority: 9,
    },
  ],
};

// Try loading persisted bot settings from DB
const initBotSettingsFromDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        id TEXT PRIMARY KEY,
        config JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const res = await query(`SELECT config FROM bot_settings WHERE id = 'default' LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].config) {
      botSettings = res.rows[0].config;
      console.log('🤖 [Bot Settings] Loaded configuration from database');
    } else {
      await query(
        `INSERT INTO bot_settings (id, config) VALUES ('default', $1) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(botSettings)]
      );
    }
  } catch (err) {
    console.warn('⚠️ [Bot Settings DB Init Warning]:', err.message);
  }
};
initBotSettingsFromDb();

// Match incoming text against bot rules
const matchBotReply = async (text, isNewConv, customerName) => {
  if (!botSettings || !botSettings.isEnabled) return null;

  const cleanText = (text || '').trim().toLowerCase();

  // 1. Human handoff check
  if (botSettings.humanHandoffEnabled) {
    const isHandoff = botSettings.humanHandoffKeywords.some((k) =>
      cleanText.includes(k.trim().toLowerCase())
    );
    if (isHandoff) {
      return {
        replyText: botSettings.handoffMessage,
        type: 'handoff',
        isHandoff: true,
      };
    }
  }

  // 2. Keyword rules check
  const activeRules = (botSettings.rules || [])
    .filter((r) => r.isActive)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  for (const rule of activeRules) {
    for (const kw of rule.keywords || []) {
      const cleanKw = kw.trim().toLowerCase();
      if (!cleanKw) continue;
      const hit = rule.matchType === 'exact' ? cleanText === cleanKw : cleanText.includes(cleanKw);
      if (hit) {
        let reply = rule.customReplyText;
        if (!reply && rule.cannedResponseId) {
          try {
            const crRes = await query('SELECT content FROM canned_responses WHERE id = $1 LIMIT 1', [
              rule.cannedResponseId,
            ]);
            if (crRes.rows.length > 0) {
              reply = crRes.rows[0].content;
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (reply) {
          reply = reply
            .replace(/{customer_name}/g, customerName || 'คุณลูกค้า')
            .replace(/{order_code}/g, 'SO-10482')
            .replace(/{tracking_no}/g, 'TH2609-88412');
          return { replyText: reply, type: 'rule', ruleName: rule.name, matchedKeyword: kw };
        }
      }
    }
  }

  // 3. Welcome message on new conversation
  if (isNewConv && botSettings.welcomeMessageEnabled) {
    let welcomeText = null;
    if (botSettings.welcomeCannedResponseId) {
      try {
        const crRes = await query('SELECT content FROM canned_responses WHERE id = $1 LIMIT 1', [
          botSettings.welcomeCannedResponseId,
        ]);
        if (crRes.rows.length > 0) {
          welcomeText = crRes.rows[0].content.replace(/{customer_name}/g, customerName || 'คุณลูกค้า');
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (welcomeText) {
      return { replyText: welcomeText, type: 'welcome' };
    }
  }

  return null;
};

// ================= LINE Webhook Handler =================
const handleLineWebhook = async (req, res) => {
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

        // Update conversation
        await query(
          `UPDATE conversations SET
            last_message_preview = $1,
            time = $2,
            unread_count = unread_count + 1,
            status = 'Open',
            customer_name = COALESCE($3, customer_name),
            customer_avatar = COALESCE($4, customer_avatar),
            updated_at = NOW()
           WHERE id = $5`,
          [text, timeStr, profile?.displayName || null, profile?.pictureUrl || null, conv.id]
        );
      } else {
        // New conversation
        const convId = `conv-line-${userId ? userId.slice(-6) : Date.now()}`;
        targetConvId = convId;
        const custId = userId || `C-LINE-${Date.now()}`;

        await query(
          `INSERT INTO conversations (id, customer_id, customer_name, customer_avatar, customer_tier, channel, channel_account, time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group, line_user_id)
           VALUES ($1,$2,$3,$4,'MEMBER','LINE','cb360 Official',$5,$6,'LINE Live',1,'Open','วิภา ส.','Customer Care','Mine',$7)`,
          [convId, custId, customerName, customerAvatar, timeStr, text, userId]
        );

        await query(
          `INSERT INTO messages (id, conversation_id, sender, text, time) VALUES ($1,$2,'customer',$3,$4)`,
          [newMsgId, convId, text, timeStr]
        );
      }

      // Check Bot Auto-Reply
      try {
        const botReply = await matchBotReply(text, isNew, customerName);
        if (botReply && botReply.replyText) {
          const botMsgId = `m-bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const botTimeStr = getThaiTime();

          // Store bot reply in DB
          await query(
            `INSERT INTO messages (id, conversation_id, sender, author_name, text, time) VALUES ($1,$2,'agent','🤖 CusBox Bot (Auto-Reply)',$3,$4)`,
            [botMsgId, targetConvId, botReply.replyText, botTimeStr]
          );

          // Update conversation preview
          await query(
            `UPDATE conversations SET last_message_preview = $1, time = $2, updated_at = NOW() WHERE id = $3`,
            [botReply.replyText, botTimeStr, targetConvId]
          );

          // Push or Reply to LINE
          if (evt.replyToken) {
            try {
              console.log(`🤖 [Bot Replying to LINE Token]: "${botReply.replyText.slice(0, 40)}..."`);
              const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                },
                body: JSON.stringify({
                  replyToken: evt.replyToken,
                  messages: [{ type: 'text', text: botReply.replyText }],
                }),
              });
              if (!lineRes.ok) {
                const errBody = await lineRes.text();
                console.error('[LINE Reply Token Error, falling back to push]:', errBody);
                if (userId) {
                  await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                    },
                    body: JSON.stringify({
                      to: userId,
                      messages: [{ type: 'text', text: botReply.replyText }],
                    }),
                  });
                }
              }
            } catch (replyErr) {
              console.error('[LINE Reply Send Failed]:', replyErr.message);
            }
          } else if (userId) {
            try {
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                },
                body: JSON.stringify({
                  to: userId,
                  messages: [{ type: 'text', text: botReply.replyText }],
                }),
              });
            } catch (pushErr) {
              console.error('[LINE Push Send Failed]:', pushErr.message);
            }
          }
        }
      } catch (botErr) {
        console.error('[Bot Auto-Reply Execution Error]:', botErr.message);
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

// Webhook routes
app.post('/api/webhooks/line/:channelId', handleLineWebhook);
app.post('/api/webhooks/line', handleLineWebhook);
app.post('/v1/webhooks/line/:channelId', handleLineWebhook);
app.post('/v1/webhooks/line', handleLineWebhook);

app.get('/api/webhooks/line/:channelId', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));
app.get('/api/webhooks/line', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));

// ================= Conversations API =================

// GET all conversations (with messages)
app.get('/api/conversations', async (req, res) => {
  try {
    const convResult = await query(
      `SELECT * FROM conversations ORDER BY updated_at DESC`
    );
    const msgResult = await query(`SELECT * FROM messages ORDER BY created_at ASC`);

    const msgMap = {};
    for (const msg of msgResult.rows) {
      if (!msgMap[msg.conversation_id]) msgMap[msg.conversation_id] = [];
      msgMap[msg.conversation_id].push(rowToMessage(msg));
    }

    const data = convResult.rows.map((row) =>
      rowToConversation(row, msgMap[row.id] || [])
    );

    return res.status(200).json({ status: 'success', data, count: data.length });
  } catch (err) {
    console.error('[GET /api/conversations Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// POST send agent message (also pushes to LINE if live)
app.post('/api/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text, isPrivate, authorName } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const convResult = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conv = convResult.rows[0];

    const timeStr = getThaiTime();
    const newMsgId = `m-${Date.now()}`;
    const sender = isPrivate ? 'note' : 'agent';
    const author = authorName || 'วิภา ส.';

    await query(
      `INSERT INTO messages (id, conversation_id, sender, author_name, text, time, is_private_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newMsgId, id, sender, author, text.trim(), timeStr, !!isPrivate]
    );

    if (!isPrivate) {
      await query(
        `UPDATE conversations SET last_message_preview=$1, time=$2, updated_at=NOW() WHERE id=$3`,
        [text.trim(), timeStr, id]
      );
    }

    // Push to LINE if real user
    if (!isPrivate && conv.line_user_id) {
      try {
        console.log(`🚀 [Pushing to LINE] User: ${conv.line_user_id}, Message: "${text}"`);
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: conv.line_user_id,
            messages: [{ type: 'text', text: text.trim() }],
          }),
        });
      } catch (err) {
        console.error('[LINE Push Error]:', err.message);
      }
    }

    const newMsg = {
      id: newMsgId,
      sender,
      authorName: author,
      text: text.trim(),
      time: timeStr,
      isPrivateNote: !!isPrivate,
    };

    return res.status(200).json({ status: 'success', message: newMsg });
  } catch (err) {
    console.error('[POST messages Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// ================= Bot Settings API =================

// GET bot settings
app.get('/api/bot-settings', (req, res) => {
  return res.status(200).json({ status: 'success', data: botSettings });
});

// POST update bot settings
app.post('/api/bot-settings', async (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration payload' });
    }
    botSettings = { ...botSettings, ...newConfig };

    try {
      await query(
        `INSERT INTO bot_settings (id, config, updated_at)
         VALUES ('default', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET config = $1, updated_at = NOW()`,
        [JSON.stringify(botSettings)]
      );
    } catch (dbErr) {
      console.warn('⚠️ [Bot Settings DB Save Error]:', dbErr.message);
    }

    return res.status(200).json({ status: 'success', data: botSettings });
  } catch (err) {
    console.error('[POST /api/bot-settings Error]:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// POST simulate bot reply
app.post('/api/bot/simulate', async (req, res) => {
  const { text, customerName } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  try {
    const match = await matchBotReply(text, false, customerName || 'สมชาย ใจดี');
    return res.status(200).json({
      status: 'success',
      matched: !!match,
      result: match || { replyText: 'ไม่พบคำสำคัญที่ตรงกับกฎใดๆ', type: 'none' },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= Canned Responses API =================

// GET all canned responses
app.get('/api/canned-responses', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM canned_responses ORDER BY usage_count DESC`
    );
    const data = result.rows.map((r) => ({
      id: r.id,
      shortcut: r.shortcut,
      title: r.title,
      category: r.category,
      content: r.content,
      tags: r.tags,
      isActive: r.is_active,
      usageCount: r.usage_count,
      lastUsedAt: r.last_used_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return res.status(200).json({ status: 'success', data, count: data.length });
  } catch (err) {
    console.error('[GET canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// POST create canned response
app.post('/api/canned-responses', async (req, res) => {
  const data = req.body;
  if (!data?.title || !data?.shortcut || !data?.content) {
    return res.status(400).json({ error: 'title, shortcut, and content are required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const id = data.id || `cr-${Date.now()}`;

  try {
    const result = await query(
      `INSERT INTO canned_responses (id, shortcut, title, category, content, tags, is_active, usage_count, last_used_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        id, data.shortcut, data.title, data.category || 'answer', data.content,
        data.tags || [], data.isActive !== undefined ? data.isActive : true,
        data.usageCount || 0, data.lastUsedAt || null, data.createdAt || today, today,
      ]
    );
    const r = result.rows[0];
    return res.status(201).json({
      status: 'success',
      data: { ...r, isActive: r.is_active, usageCount: r.usage_count },
    });
  } catch (err) {
    console.error('[POST canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// PUT update canned response
app.put('/api/canned-responses/:id', async (req, res) => {
  const { id } = req.params;
  const upd = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await query(
      `UPDATE canned_responses SET
        shortcut    = COALESCE($1, shortcut),
        title       = COALESCE($2, title),
        category    = COALESCE($3, category),
        content     = COALESCE($4, content),
        tags        = COALESCE($5, tags),
        is_active   = COALESCE($6, is_active),
        usage_count = COALESCE($7, usage_count),
        last_used_at= COALESCE($8, last_used_at),
        updated_at  = $9
       WHERE id = $10
       RETURNING *`,
      [
        upd.shortcut || null, upd.title || null, upd.category || null,
        upd.content || null, upd.tags || null,
        upd.isActive !== undefined ? upd.isActive : null,
        upd.usageCount !== undefined ? upd.usageCount : null,
        upd.lastUsedAt || null, today, id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Canned response not found' });
    }
    const r = result.rows[0];
    return res.status(200).json({
      status: 'success',
      data: { ...r, isActive: r.is_active, usageCount: r.usage_count },
    });
  } catch (err) {
    console.error('[PUT canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// DELETE canned response
app.delete('/api/canned-responses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `DELETE FROM canned_responses WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Canned response not found' });
    }
    return res.status(200).json({ status: 'success', deleted: result.rows[0] });
  } catch (err) {
    console.error('[DELETE canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// ================= Meta / Facebook Webhook =================
const handleMetaGet = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) return res.status(200).send(challenge);
  return res.status(200).send('Meta Webhook Endpoint Active');
};

app.get('/api/webhooks/meta/:pageId', handleMetaGet);
app.get('/api/webhooks/meta', handleMetaGet);

// ================= Static Frontend (Vite SPA) =================
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CusBox 360 Production Server running on port ${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (via DATABASE_URL)`);
  console.log(`📡 LINE Webhook: http://0.0.0.0:${PORT}/api/webhooks/line/:channelId`);
});
