/**
 * verifyLineSignature.js
 * Cryptographic signature verification middleware for incoming LINE Messaging API Webhooks.
 *
 * Compliant with:
 * - ISO/IEC 27001:2022 Control A.10 (Cryptographic Controls)
 * - ISO/IEC 29100 Privacy Framework (Authenticity & Integrity of PII sources)
 * - OWASP API Security (API8 / API10)
 */

import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Validates a LINE webhook signature using HMAC-SHA256.
 * Uses crypto.timingSafeEqual to prevent side-channel timing attacks.
 *
 * @param {Buffer|string} rawBody - The unparsed request body from LINE
 * @param {string} signature - The X-Line-Signature header value (Base64)
 * @param {string} channelSecret - LINE Channel Secret
 * @returns {boolean} True if the signature matches cryptographically
 */
export const validateLineSignature = (rawBody, signature, channelSecret) => {
  if (!rawBody || !signature || !channelSecret) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(rawBody)
      .digest('base64');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const hashBuffer = Buffer.from(hash, 'utf8');

    // timingSafeEqual requires buffers of identical length
    if (signatureBuffer.length !== hashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, hashBuffer);
  } catch (err) {
    console.error('[LINE Signature Verification Error]:', err.message);
    return false;
  }
};

/**
 * Express middleware to verify X-Line-Signature on incoming webhooks.
 * Halts processing with HTTP 401 if signature is missing or tampered.
 */
export const verifyLineSignature = (req, res, next) => {
  // Allow test environments to bypass ONLY if explicitly configured
  if (process.env.NODE_ENV === 'test' && req.headers['x-skip-signature-test'] === 'true') {
    return next();
  }

  const signature = req.headers['x-line-signature'] || req.headers['X-Line-Signature'];
  if (!signature) {
    console.warn('⚠️ [Security Block]: Rejected LINE webhook without X-Line-Signature header');
    return res.status(401).json({
      error: 'Unauthorized: Missing X-Line-Signature header',
      code: 'MISSING_LINE_SIGNATURE',
    });
  }

  const channelSecret = env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('❌ [Security Error]: LINE_CHANNEL_SECRET is not configured on server');
    return res.status(500).json({
      error: 'Server misconfiguration: LINE_CHANNEL_SECRET is missing',
      code: 'MISSING_CHANNEL_SECRET',
    });
  }

  const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : '');
  const isValid = validateLineSignature(rawBody, signature, channelSecret);

  if (!isValid) {
    console.warn('⚠️ [Security Block]: Rejected LINE webhook with invalid cryptographic signature');
    return res.status(401).json({
      error: 'Unauthorized: Invalid LINE Webhook signature',
      code: 'INVALID_LINE_SIGNATURE',
    });
  }

  return next();
};
