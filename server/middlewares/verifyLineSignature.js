/**
 * verifyLineSignature.js
 * Cryptographic signature verification middleware for incoming LINE Messaging API Webhooks.
 * Supports both env.LINE_CHANNEL_SECRET and DB-cached appSecret saved via /connectors.
 */
import crypto from 'crypto';
import { env } from '../config/env.js';
import { getCachedLineChannelSecret } from '../services/lineService.js';
import { recordWebhookDiagnostic } from '../services/lineWebhookDiagnostics.js';

export const validateLineSignature = (rawBody, signature, channelSecret) => {
  if (!rawBody || !signature || !channelSecret) return false;
  try {
    const hash = crypto.createHmac('SHA256', channelSecret).update(rawBody).digest('base64');
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const hashBuffer = Buffer.from(hash, 'utf8');
    if (signatureBuffer.length !== hashBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, hashBuffer);
  } catch (err) {
    console.error('[LINE Signature Verification Error]:', err.message);
    return false;
  }
};

export const verifyLineSignature = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' && req.headers['x-skip-signature-test'] === 'true') {
    return next();
  }

  const signature = req.headers['x-line-signature'] || req.headers['X-Line-Signature'];
  if (!signature) {
    recordWebhookDiagnostic({
      status: 'missing_signature',
      error: 'Missing X-Line-Signature header',
      incrementReceived: true,
    });
    console.warn('⚠️ [Security Block]: Rejected LINE webhook without X-Line-Signature header');
    return res.status(401).json({
      error: 'Unauthorized: Missing X-Line-Signature header',
      code: 'MISSING_LINE_SIGNATURE',
    });
  }

  const candidateSecrets = Array.from(
    new Set([getCachedLineChannelSecret(), env.LINE_CHANNEL_SECRET].map((s) => String(s || '').trim()).filter(Boolean))
  );

  if (candidateSecrets.length === 0) {
    recordWebhookDiagnostic({
      status: 'missing_secret',
      error: 'LINE_CHANNEL_SECRET is not configured on server or in /connectors',
      incrementReceived: true,
    });
    console.error('❌ [Security Error]: LINE_CHANNEL_SECRET is not configured on server');
    return res.status(500).json({
      error: 'Server misconfiguration: LINE_CHANNEL_SECRET is missing',
      code: 'MISSING_CHANNEL_SECRET',
    });
  }

  const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : '');
  const isValid = candidateSecrets.some((secret) => validateLineSignature(rawBody, signature, secret));

  if (!isValid) {
    recordWebhookDiagnostic({
      status: 'invalid_signature',
      error: 'Invalid X-Line-Signature (Channel Secret mismatch)',
      incrementReceived: true,
    });
    console.warn('⚠️ [Security Block]: Rejected LINE webhook with invalid cryptographic signature');
    return res.status(401).json({
      error: 'Unauthorized: Invalid LINE Webhook signature',
      code: 'INVALID_LINE_SIGNATURE',
    });
  }

  return next();
};
