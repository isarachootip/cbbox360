/**
 * cryptoUtils.js
 * Server-side cryptographic helpers:
 * - Password hashing & verification (Node native crypto.scrypt, memory-hard KDF, zero native C++ addon deps)
 * - Cryptographically secure session tokens & SHA-256 hashing
 * - AES-256-GCM authenticated encryption for TOTP secrets at rest
 */
import crypto from 'crypto';
import { promisify } from 'util';
import { env } from '../config/env.js';

const scryptAsync = promisify(crypto.scrypt);
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_KEYLEN = 64;

/**
 * Hashes a plaintext password using memory-hard scrypt (PHC string format)
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export const hashPassword = async (plainPassword) => {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(String(plainPassword), salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `$scrypt$n=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${salt.toString('base64url')}$${Buffer.from(derivedKey).toString('base64url')}`;
};

/**
 * Verifies a plaintext password against a stored password hash in constant time
 * @param {string} hash
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (hash, plainPassword) => {
  if (!hash || !plainPassword || typeof hash !== 'string') return false;
  try {
    const parts = hash.split('$');
    // Format: $scrypt$n=16384,r=8,p=1$<saltB64>$<keyB64>
    if (parts[1] !== 'scrypt' || parts.length !== 5) return false;
    const salt = Buffer.from(parts[3], 'base64url');
    const expectedKey = Buffer.from(parts[4], 'base64url');
    const derivedKey = Buffer.from(
      await scryptAsync(String(plainPassword), salt, expectedKey.length, SCRYPT_PARAMS)
    );
    if (derivedKey.length !== expectedKey.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedKey);
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
