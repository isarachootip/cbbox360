import { env } from '../config/env.js';

export const fetchLineProfile = async (userId) => {
  if (!userId || !env.LINE_CHANNEL_ACCESS_TOKEN) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('[LINE Profile Fetch Error]:', err.message);
  }
  return null;
};

export const sendLineReply = async (replyToken, text) => {
  if (!replyToken || !env.LINE_CHANNEL_ACCESS_TOKEN) return false;
  try {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
    return lineRes.ok;
  } catch (err) {
    console.error('[LINE Reply Send Failed]:', err.message);
    return false;
  }
};

export const sendLinePush = async (userId, text) => {
  if (!userId) {
    return { success: false, error: 'User ID is missing' };
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' };
  }

  try {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text }],
      }),
    });

    if (lineRes.ok) {
      return { success: true, status: lineRes.status };
    }

    const errBody = await lineRes.json().catch(() => ({}));
    const errorMessage = errBody.message || `LINE Messaging API Error (HTTP ${lineRes.status})`;
    console.error(`[LINE Push Send Failed]: HTTP ${lineRes.status}`, errorMessage);

    return {
      success: false,
      status: lineRes.status,
      error: errorMessage,
      details: errBody.details || null,
    };
  } catch (err) {
    console.error('[LINE Push Send Failed]:', err.message);
    return { success: false, error: err.message };
  }
};
