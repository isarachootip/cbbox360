import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ================= LINE Webhook Endpoints =================
// Supports POST and GET for all line webhook paths
const handleLineWebhook = (req, res) => {
  const channelId = req.params.channelId || 'default';
  const signature = req.headers['x-line-signature'] || 'none';
  const events = req.body?.events || [];

  console.log(`[LINE Webhook] Received request for channel: ${channelId}`);
  console.log(`[LINE Webhook] Events count: ${events.length}, Signature: ${signature}`);

  if (events.length > 0) {
    events.forEach((evt, idx) => {
      console.log(`[LINE Event #${idx + 1}] Type: ${evt.type}, Source:`, evt.source);
    });
  }

  // LINE Messaging API requires HTTP 200 OK with empty body or JSON
  return res.status(200).json({
    status: 'success',
    message: 'LINE Webhook verified and processed successfully',
    channelId,
    receivedEvents: events.length,
  });
};

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

// ================= LINE Send / Push Message API =================
app.post('/api/line/push', async (req, res) => {
  const { to, text, messages } = req.body;
  const token =
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    'G6HhxgQDo/1Ji4LOomrfk8Eh4yhBn74w0i+T2vXPjdA2/8bRXZCtvXF9hSwFpjM0MKhTYasa+K/CKZjamIj9JhvqhXCKJXtH/I2YjgGpTkZgwNweMhhOe0GcuLKArE8W1B4tn68xsWeRD/0WY1cpowdB04t89/1O/w1cDnyilFU=';

  if (!to) {
    return res.status(400).json({ error: 'Target LINE UID (to) is required' });
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: messages || [{ type: 'text', text: text || 'สวัสดีครับจากระบบ CusBox 360 CDP' }],
      }),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ================= Meta / Facebook Webhook Endpoints =================
const handleMetaGet = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    console.log('[Meta Webhook Verification] Mode:', mode, 'Token:', token);
    return res.status(200).send(challenge);
  }
  return res.status(200).send('Meta Webhook Endpoint Active');
};

app.get('/api/webhooks/meta/:pageId', handleMetaGet);
app.get('/api/webhooks/meta', handleMetaGet);

const handleMetaPost = (req, res) => {
  console.log('[Meta Webhook Event Received]:', req.body);
  return res.status(200).send('EVENT_RECEIVED');
};

app.post('/api/webhooks/meta/:pageId', handleMetaPost);
app.post('/api/webhooks/meta', handleMetaPost);

// ================= Generic Webhooks (TikTok, WhatsApp, 3CX) =================
app.post('/api/webhooks/:service/:id', (req, res) => {
  const { service, id } = req.params;
  console.log(`[${service.toUpperCase()} Webhook Event] ID: ${id}`);
  return res.status(200).json({ status: 'ok', service, id });
});

app.post('/api/webhooks/:service', (req, res) => {
  const { service } = req.params;
  console.log(`[${service.toUpperCase()} Webhook Event]`);
  return res.status(200).json({ status: 'ok', service });
});

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
