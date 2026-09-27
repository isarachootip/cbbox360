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

      if (existResult.rows.length > 0) {
        const conv = existResult.rows[0];

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
