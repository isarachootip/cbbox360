import { getBotSettings, updateBotSettings, matchBotReply } from '../services/botEngineService.js';

export const getBotSettingsHandler = (req, res) => {
  return res.status(200).json({ status: 'success', data: getBotSettings() });
};

export const updateBotSettingsHandler = async (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration payload' });
    }
    const updated = await updateBotSettings(newConfig);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    console.error('[POST /api/bot-settings Error]:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};

export const simulateBotReplyHandler = async (req, res) => {
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
};
