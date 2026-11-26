import { Router } from 'express';
import {
  getLineAccessToken,
  getCachedLineChannelSecret,
  initLineConfigFromDb,
  setLineAccessToken,
  getLineBotInfo,
  sendLinePush,
} from '../services/lineService.js';
import { getWebhookDiagnostics } from '../services/lineWebhookDiagnostics.js';
import { getBotSettings } from '../services/botEngineService.js';
import { getActiveGeminiModel } from '../services/geminiService.js';
import { env } from '../config/env.js';

const router = Router();

const buildDiagnosticsPayload = () => {
  const hasChannelSecret = Boolean(getCachedLineChannelSecret() || env.LINE_CHANNEL_SECRET);
  const botCfg = getBotSettings();
  const geminiConfigured = Boolean(botCfg?.geminiApiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  return {
    hasChannelSecret,
    geminiConfigured,
    geminiModel: getActiveGeminiModel(),
    webhookDiagnostics: getWebhookDiagnostics(),
  };
};

// GET /api/connectors/line — Get LINE connection status, bot profile & live webhook diagnostics
router.get('/line', async (req, res) => {
  await initLineConfigFromDb();
  const token = await getLineAccessToken();
  const diag = buildDiagnosticsPayload();

  if (!token) {
    return res.status(200).json({
      status: 'disconnected',
      hasToken: false,
      message: 'LINE_CHANNEL_ACCESS_TOKEN is not configured',
      ...diag,
    });
  }

  const botInfo = await getLineBotInfo();
  return res.status(200).json({
    status: botInfo.success ? 'connected' : 'error',
    hasToken: true,
    tokenPreview: `${token.slice(0, 8)}...${token.slice(-6)}`,
    botInfo: botInfo.data || null,
    error: botInfo.error || null,
    ...diag,
  });
});

// POST /api/connectors/line — Save LINE credentials directly into DB & in-memory cache
router.post('/line', async (req, res) => {
  const { accessToken, appId, appSecret, basicId } = req.body;
  if (!accessToken?.trim()) {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  const saved = await setLineAccessToken(accessToken.trim(), {
    appId: appId?.trim(),
    appSecret: appSecret?.trim(),
    basicId: basicId?.trim(),
  });

  if (!saved) {
    return res.status(500).json({ error: 'Failed to save connector configuration' });
  }

  const botInfo = await getLineBotInfo();
  return res.status(200).json({
    status: botInfo.success ? 'connected' : 'error',
    message: botInfo.success
      ? `เชื่อมต่อกับ LINE Official Account "${botInfo.data?.displayName || ''}" สำเร็จ!`
      : 'บันทึกสำเร็จ แต่ Token ตรวจสอบไม่ผ่าน: ' + (botInfo.error || ''),
    botInfo: botInfo.data || null,
    ...buildDiagnosticsPayload(),
  });
});

// POST /api/connectors/line/test — Send test push message
router.post('/line/test', async (req, res) => {
  const { userId, text } = req.body;
  if (!userId?.trim() || !text?.trim()) {
    return res.status(400).json({ error: 'userId and text are required' });
  }

  const result = await sendLinePush(userId.trim(), text.trim());
  return res.status(result.success ? 200 : 400).json(result);
});

export default router;
