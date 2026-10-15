import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
  generateTemporaryPassword,
  encryptSecret,
  decryptSecret,
} from '../cryptoUtils.js';
import {
  generateTotpSecretServer,
  generateTotpUriServer,
  generateTotpCodeServer,
  verifyTotpCodeServer,
  generateQrDataUrl,
} from '../totpServer.js';

describe('cryptoUtils - Scrypt Password Hashing, Session Hashing & AES-256-GCM', () => {
  it('hashes and verifies passwords with scrypt', async () => {
    const plain = 'S3cureP@ssw0rd!2026';
    const hash = await hashPassword(plain);

    expect(hash).toContain('$scrypt$');
    expect(hash).not.toContain(plain);

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword(hash, 'WrongPassword');
    expect(isWrong).toBe(false);
  });

  it('generates session token and deterministic SHA-256 session hash', () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);

    const h1 = hashSessionToken(token);
    const h2 = hashSessionToken(token);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(token);
    expect(h1).toHaveLength(64);
  });

  it('generates cryptographically random temporary passwords', () => {
    const p1 = generateTemporaryPassword(12);
    const p2 = generateTemporaryPassword(12);
    expect(p1).toHaveLength(12);
    expect(p2).toHaveLength(12);
    expect(p1).not.toBe(p2);
  });

  it('encrypts and decrypts TOTP secret with AES-256-GCM', () => {
    const rawSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(rawSecret);
    expect(encrypted).not.toContain(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:cipherText

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });
});

describe('totpServer - RFC 6238 Server-Side 2FA Verification', () => {
  it('generates valid Base32 secret and verifies current TOTP code', () => {
    const secret = generateTotpSecretServer(20);
    expect(secret.length).toBeGreaterThanOrEqual(32);

    const now = 1700000000000;
    const code = generateTotpCodeServer(secret, now);
    expect(code).toMatch(/^\d{6}$/);

    // Verify exact timestamp and +30s drift window
    expect(verifyTotpCodeServer(code, secret, 2, now)).toBe(true);
    expect(verifyTotpCodeServer(code, secret, 2, now + 30000)).toBe(true);
    expect(verifyTotpCodeServer('000000', secret, 2, now)).toBe(false);
  });

  it('generates otpauth URI and QR Data URL', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateTotpUriServer('sysadmin', secret, 'CustBox360');
    expect(uri).toContain('otpauth://totp/CustBox360:sysadmin?secret=JBSWY3DPEHPK3PXP');

    const qr = await generateQrDataUrl(uri);
    expect(qr).toMatch(/^data:image\/png;base64,/);
  });
});
