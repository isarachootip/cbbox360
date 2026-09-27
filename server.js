import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ================= Live In-Memory Conversations Store =================
let liveConversations = [
  {
    id: 'conv-1',
    customerId: 'C00123',
    customerName: 'สมชาย ใจดี',
    customerTier: 'PLATINUM',
    channel: 'LINE',
    channelAccount: 'cb360 Official',
    time: '10:41',
    lastMessagePreview: 'ของจะถึงพรุ่งนี้ใช่ไหมครับ',
    label: 'จัดส่ง',
    unreadCount: 0,
    status: 'Open',
    assignedTo: 'วิภา ส.',
    team: 'Customer Care',
    tabGroup: 'Mine',
    messages: [
      {
        id: 'm-1',
        sender: 'customer',
        text: 'สวัสดีครับ สั่งหมึกพิมพ์ไปเมื่อ 14 ก.ย. เลข SO-10482 ครับ',
        time: '10:32',
      },
      {
        id: 'm-2',
        sender: 'customer',
        text: 'ของจะถึงเมื่อไหร่ครับ ต้องใช้ด่วน',
        time: '10:33',
      },
      {
        id: 'm-3',
        sender: 'note',
        authorName: 'วิภา ส.',
        text: '@ธนพล ลูกค้า Platinum มี Deal ต่อสัญญาค้างอยู่ ช่วยโทรตามหลังปิดแชทนี้ด้วย',
        time: '10:35',
        isPrivateNote: true,
      },
      {
        id: 'm-4',
        sender: 'agent',
        authorName: 'วิภา ส.',
        text: 'สวัสดีค่ะคุณสมชาย ตรวจสอบแล้ว SO-10482 ออกจากคลังวันนี้ จะถึงพรุ่งนี้ก่อน 12:00 ค่ะ เลขพัสดุ TH2609-88412',
        time: '10:38',
        trackingNumber: 'TH2609-88412',
      },
      {
        id: 'm-5',
        sender: 'customer',
        text: 'ของจะถึงพรุ่งนี้ใช่ไหมครับ',
        time: '10:41',
      },
    ],
  },
  {
    id: 'conv-2',
    customerId: 'C00124',
    customerName: 'บจก. นำชัยการพิมพ์',
    customerTier: 'GOLD',
    channel: 'LINE',
    channelAccount: 'cb360 Official',
    time: '10:36',
    lastMessagePreview: 'ขอใบเสนอราคาเครื่องพิมพ์ 5 เครื่อง',
    label: 'ใบเสนอราคา',
    unreadCount: 2,
    status: 'Open',
    assignedTo: 'ธนพล ก.',
    team: 'Sales',
    tabGroup: 'All',
    messages: [
      {
        id: 'm-201',
        sender: 'customer',
        text: 'ขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่องครับ',
        time: '10:36',
      },
    ],
  },
];

// Helper: Format current Thai time
const getThaiTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// Helper: Fetch user profile from LINE Messaging API
const fetchLineProfile = async (userId) => {
  if (!userId || !LINE_CHANNEL_ACCESS_TOKEN) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });
    if (res.ok) {
      return await res.json(); // { displayName, userId, pictureUrl, statusMessage }
    }
  } catch (err) {
    console.error('[LINE Profile Fetch Error]:', err.message);
  }
  return null;
};

// ================= LINE Webhook Handler =================
const handleLineWebhook = async (req, res) => {
  const channelId = req.params.channelId || '2011580063';
  const signature = req.headers['x-line-signature'] || 'none';
  const events = req.body?.events || [];

  console.log(`[LINE Webhook] Received ${events.length} event(s) for channel: ${channelId}`);

  // Process incoming events in the background
  for (const evt of events) {
    console.log(`[LINE Event] Type: ${evt.type}, Mode: ${evt.mode}, Source:`, evt.source);

    if (evt.type === 'message' && evt.message?.type === 'text') {
      const userId = evt.source?.userId;
      const text = evt.message.text;
      const timeStr = getThaiTime();

      console.log(`📩 [LINE Incoming Message] From: ${userId}, Text: "${text}"`);

      // Try fetching profile
      const profile = await fetchLineProfile(userId);
      const customerName = profile?.displayName || 'ลูกค้า LINE (ใหม่)';
      const customerAvatar = profile?.pictureUrl || undefined;

      // Find existing conversation for this LINE user
      const existingConvIndex = liveConversations.findIndex(
        (c) => c.lineUserId === userId || (c.customerId === userId)
      );

      const newMsg = {
        id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender: 'customer',
        text,
        time: timeStr,
      };

      if (existingConvIndex >= 0) {
        // Append message and bring conversation to top
        const conv = liveConversations[existingConvIndex];
        conv.messages.push(newMsg);
        conv.lastMessagePreview = text;
        conv.time = timeStr;
        conv.unreadCount = (conv.unreadCount || 0) + 1;
        conv.status = 'Open';
        if (profile?.displayName) conv.customerName = profile.displayName;
        if (profile?.pictureUrl) conv.customerAvatar = profile.pictureUrl;

        // Move to top
        liveConversations.splice(existingConvIndex, 1);
        liveConversations.unshift(conv);
      } else {
        // Create brand new conversation
        const newConv = {
          id: `conv-line-${userId ? userId.slice(-6) : Date.now()}`,
          customerId: userId || `C-LINE-${Date.now()}`,
          customerName,
          customerAvatar,
          customerTier: 'MEMBER',
          channel: 'LINE',
          channelAccount: 'cb360 Official',
          time: timeStr,
          lastMessagePreview: text,
          label: 'LINE Live',
          unreadCount: 1,
          status: 'Open',
          assignedTo: 'วิภา ส.',
          team: 'Customer Care',
          tabGroup: 'Mine',
          lineUserId: userId,
          messages: [newMsg],
        };
        liveConversations.unshift(newConv);
      }
    }
  }

  // LINE Messaging API requires HTTP 200 OK
  return res.status(200).json({
    status: 'success',
    message: 'Webhook processed successfully',
    channelId,
    receivedEvents: events.length,
  });
};

// Route mappings for Webhooks
app.post('/api/webhooks/line/:channelId', handleLineWebhook);
app.post('/api/webhooks/line', handleLineWebhook);
app.post('/v1/webhooks/line/:channelId', handleLineWebhook);
app.post('/v1/webhooks/line', handleLineWebhook);

app.get('/api/webhooks/line/:channelId', (req, res) => {
  res.status(200).send('LINE Webhook Endpoint is Active (HTTP 200 OK)');
});
app.get('/api/webhooks/line', (req, res) => {
  res.status(200).send('LINE Webhook Endpoint is Active (HTTP 200 OK)');
});

// ================= Conversations API (for Web Frontend) =================
app.get('/api/conversations', (req, res) => {
  return res.status(200).json({
    status: 'success',
    data: liveConversations,
    count: liveConversations.length,
  });
});

// Send message from agent on web dashboard -> sends back to LINE user!
app.post('/api/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text, isPrivate, authorName } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const conv = liveConversations.find((c) => c.id === id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const timeStr = getThaiTime();
  const newMsg = {
    id: `m-${Date.now()}`,
    sender: isPrivate ? 'note' : 'agent',
    authorName: authorName || 'วิภา ส.',
    text: text.trim(),
    time: timeStr,
    isPrivateNote: !!isPrivate,
  };

  conv.messages.push(newMsg);
  if (!isPrivate) {
    conv.lastMessagePreview = text.trim();
    conv.time = timeStr;
  }

  // If this conversation is connected to a real LINE user, push the message to LINE!
  if (!isPrivate && conv.lineUserId) {
    try {
      console.log(`🚀 [Pushing to LINE] User: ${conv.lineUserId}, Message: "${text}"`);
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: conv.lineUserId,
          messages: [{ type: 'text', text: text.trim() }],
        }),
      });
    } catch (err) {
      console.error('[LINE Push Error]:', err.message);
    }
  }

  return res.status(200).json({ status: 'success', message: newMsg, conversation: conv });
});

// ================= Meta / Facebook Webhook Endpoints =================
const handleMetaGet = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    return res.status(200).send(challenge);
  }
  return res.status(200).send('Meta Webhook Endpoint Active');
};

app.get('/api/webhooks/meta/:pageId', handleMetaGet);
app.get('/api/webhooks/meta', handleMetaGet);

// ================= Static Frontend Assets (Vite SPA) =================
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all fallback for React Router (SPA)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CusBox 360 Production Server running on port ${PORT}`);
  console.log(`📡 LINE Webhook listening at: http://0.0.0.0:${PORT}/api/webhooks/line/:channelId`);
});
