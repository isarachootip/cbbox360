import { env } from '../config/env.js';
import { query } from '../../db.js';
import fs from 'fs';
import path from 'path';

let cachedToken = null;

/**
 * Resolves active LINE Channel Access Token dynamically:
 * 1. Database connector_settings ('line')
 * 2. process.env.LINE_CHANNEL_ACCESS_TOKEN
 * 3. Local .env file on disk
 */
export const getLineAccessToken = async () => {
  if (cachedToken) return cachedToken;

  // 1. Database config
  try {
    const res = await query(`SELECT config FROM connector_settings WHERE id = 'line' LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].config?.accessToken) {
      cachedToken = res.rows[0].config.accessToken.trim();
      return cachedToken;
    }
  } catch {
    // DB might not be ready yet
  }

  // 2. Environment variable
  if (env.LINE_CHANNEL_ACCESS_TOKEN && env.LINE_CHANNEL_ACCESS_TOKEN.trim()) {
    cachedToken = env.LINE_CHANNEL_ACCESS_TOKEN.trim();
    return cachedToken;
  }

  // 3. Local .env file fallback (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/LINE_CHANNEL_ACCESS_TOKEN=(.+)/);
        if (match && match[1]?.trim()) {
          cachedToken = match[1].trim();
          return cachedToken;
        }
      }
    } catch {
      // Ignore error
    }
  }

  return '';
};

export const _resetCachedTokenForTesting = () => {
  cachedToken = null;
};

export const setLineAccessToken = async (token, extraConfig = {}) => {
  cachedToken = (token || '').trim();
  try {
    const config = { accessToken: cachedToken, ...extraConfig };
    await query(
      `INSERT INTO connector_settings (id, config, updated_at)
       VALUES ('line', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET config = $1, updated_at = NOW()`,
      [JSON.stringify(config)]
    );
    return true;
  } catch (err) {
    console.error('[LINE Config Save Error]:', err.message);
    return false;
  }
};

export const fetchLineProfile = async (userId) => {
  const token = await getLineAccessToken();
  if (!userId || !token) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('[LINE Profile Fetch Error]:', err.message);
  }
  return null;
};

export const sendLineReply = async (replyToken, text) => {
  const token = await getLineAccessToken();
  if (!replyToken || !token) {
    console.warn('[LINE Reply Skipped]: Missing replyToken or access token');
    return false;
  }
  try {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
    if (lineRes.ok) return true;

    const errBody = await lineRes.json().catch(() => ({}));
    console.error(`[LINE Reply Send Failed]: HTTP ${lineRes.status}`, errBody);
    return false;
  } catch (err) {
    console.error('[LINE Reply Send Failed]:', err.message);
    return false;
  }
};

export const sendLinePush = async (userId, text) => {
  if (!userId) {
    return { success: false, error: 'User ID is missing' };
  }
  const token = await getLineAccessToken();
  if (!token) {
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured on server' };
  }

  try {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
    console.error(`[LINE Push Send Failed]: HTTP ${lineRes.status}`, errorMessage, errBody);

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

export const getLineBotInfo = async () => {
  const token = await getLineAccessToken();
  if (!token) return { success: false, error: 'Token is not configured' };
  try {
    const res = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, status: res.status, error: err.message || 'Failed to fetch bot info' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
