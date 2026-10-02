import { describe, it, expect } from 'vitest';
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotpUri,
  generateTotpCode,
  verifyTotpCode,
  formatSecretForDisplay,
} from '../src/utils/totp';

describe('TOTP RFC 6238 & Base32 Engine', () => {
  it('should encode and decode base32 correctly', () => {
    const raw = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = base32Encode(raw);
    expect(encoded).toBe('JBSWY3DP');

    const decoded = base32Decode(encoded);
    expect(decoded).toEqual(raw);
  });

  it('should generate a valid 32-character Base32 secret', () => {
    const secret = generateTotpSecret(20);
    expect(secret.length).toBe(32);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('should generate proper otpauth URI for Microsoft Authenticator', () => {
    const uri = generateTotpUri('sysadmin', 'JBSWY3DPEHPK3PXP', 'CustBox360');
    expect(uri).toContain('otpauth://totp/CustBox360:sysadmin');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=CustBox360');
  });

  it('should format secret key into 4-character chunks for manual entry', () => {
    const formatted = formatSecretForDisplay('JBSWY3DPEHPK3PXP');
    expect(formatted).toBe('JBSW Y3DP EHPK 3PXP');
  });

  it('should generate a 6-digit TOTP code and verify it successfully', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = await generateTotpCode(secret);
    expect(code).toMatch(/^\d{6}$/);

    const isValid = await verifyTotpCode(code, secret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid 6-digit TOTP codes', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const isValid = await verifyTotpCode('000000', secret);
    // Almost certainly false unless current time step happens to hit 000000
    const code = await generateTotpCode(secret);
    const wrongCode = code === '123456' ? '654321' : '123456';
    const isWrongValid = await verifyTotpCode(wrongCode, secret);
    expect(isWrongValid).toBe(false);
  });
});
