/**
 * cryptoUtils.js
 * Server-side cryptographic helpers:
 * - Argon2id password hashing & verification
 * - Cryptographically secure session tokens & SHA-256 hashing
 * - AES-256-GCM authenticated encryption for TOTP secrets at rest
 */
import crypto from 'crypto';
import argon2 from 'argon2';
import { env } from '../config/env.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

/**
 * Hashes a plaintext password using Argon2id
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export const hashPassword = async (plainPassword) => {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
};

/**
 * Verifies a plaintext password against an Argon2id hash
 * @param {string} hash
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (hash, plainPassword) => {
  if (!hash || !plainPassword) return false;
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
};

/**
 * Generates a 256-bit (32-byte) cryptographically random hex session token
 * @returns {string}
 */
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hashes a session token using SHA-256 so raw tokens are never stored in the database
 * @param {string} token
 * @returns {string}
 */
export const hashSessionToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

/**
 * Generates a human-friendly cryptographically random temporary password
 * @param {number} length
 * @returns {string}
 */
export const generateTemporaryPassword = (length = 12) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
};

/**
 * Derives a 32-byte AES-256 key from TOTP_ENCRYPTION_KEY
 * @returns {Buffer}
 */
const getAesKey = () => {
  const rawKey = env.TOTP_ENCRYPTION_KEY || 'cb360-default-dev-totp-key-32bytes!';
  return crypto.createHash('sha256').update(rawKey).digest();
};

/**
 * Encrypts a sensitive string (e.g., TOTP Base32 secret) using AES-256-GCM
 * Format: ivHex:authTagHex:cipherTextHex
 * @param {string} plainText
 * @returns {string}
 */
export const encryptSecret = (plainText) => {
  const iv = crypto.randomBytes(12);
  const key = getAesKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string
 * @param {string} payload
 * @returns {string | null}
 */
export const decryptSecret = (payload) => {
  if (!payload || typeof payload !== 'string') return null;
  const parts = payload.split(':');
  if (parts.length !== 3) return null;
  try {
    const [ivHex, authTagHex, cipherHex] = parts;
    const key = getAesKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
};
