/**
 * totpServer.js
 * Server-side RFC 6238 TOTP (Time-Based One-Time Password) & QR Code generator
 * Compatible with Microsoft Authenticator & Google Authenticator
 */
import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a Buffer into a Base32 string
 * @param {Buffer | Uint8Array} buffer
 * @returns {string}
 */
export const base32EncodeServer = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

/**
 * Decodes a Base32 string into a Buffer
 * @param {string} input
 * @returns {Buffer}
 */
export const base32DecodeServer = (input) => {
  const cleaned = String(input)
    .toUpperCase()
    .replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

/**
 * Generates a cryptographically secure Base32 secret (default 20 bytes = 32 Base32 chars)
 * @param {number} byteLength
 * @returns {string}
 */
export const generateTotpSecretServer = (byteLength = 20) => {
  return base32EncodeServer(crypto.randomBytes(byteLength));
};

/**
 * Generates standard otpauth URI for Authenticator apps
 * @param {string} username
 * @param {string} secret
 * @param {string} issuer
 * @returns {string}
 */
export const generateTotpUriServer = (username, secret, issuer = 'CustBox360') => {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(username);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
};

/**
 * Formats secret into 4-character blocks for manual entry
 * @param {string} secret
 * @returns {string}
 */
export const formatSecretDisplay = (secret) => {
  return String(secret).replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') || secret;
};

/**
 * Generates a 6-digit TOTP code for a given timestamp (ms)
 * @param {string} secret
 * @param {number} timestampMs
 * @returns {string}
 */
export const generateTotpCodeServer = (secret, timestampMs = Date.now()) => {
  const stepSeconds = 30;
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(0, 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const keyBuf = base32DecodeServer(secret);
  const hmac = crypto.createHmac('sha1', keyBuf).update(counterBuf).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
};

/**
 * Verifies a 6-digit TOTP code with time-drift tolerance (+/- windowSteps * 30s)
 * @param {string} token
 * @param {string} secret
 * @param {number} windowSteps
 * @param {number} nowMs
 * @returns {boolean}
 */
export const verifyTotpCodeServer = (token, secret, windowSteps = 2, nowMs = Date.now()) => {
  const cleanToken = String(token || '').trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken) || !secret) {
    return false;
  }

  const stepMs = 30 * 1000;
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const expected = generateTotpCodeServer(secret, nowMs + i * stepMs);
    if (
      expected.length === cleanToken.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanToken))
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Generates a PNG Data URL QR code for an otpauth URI
 * @param {string} otpauthUri
 * @returns {Promise<string>}
 */
export const generateQrDataUrl = async (otpauthUri) => {
  return QRCode.toDataURL(otpauthUri, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
};
