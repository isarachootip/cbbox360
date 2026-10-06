import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { validateLineSignature, verifyLineSignature } from './verifyLineSignature.js';
import { env } from '../config/env.js';

describe('verifyLineSignature - Cryptographic Verification (ISO 27001 / ISO 29100)', () => {
  const testSecret = 'f2030ccfd113a46d89297e3919df39c1';
  const testBody = JSON.stringify({
    destination: 'U9db71d0a49fc27a820ad81d919b37885',
    events: [
      {
        type: 'message',
        message: { type: 'text', text: 'สวัสดี' },
        timestamp: 1625488422200,
        source: { type: 'user', userId: 'U123456789' },
      },
    ],
  });

  const generateSignature = (body, secret) => {
    return crypto
      .createHmac('SHA256', secret)
      .update(Buffer.from(body, 'utf8'))
      .digest('base64');
  };

  describe('validateLineSignature function', () => {
    it('returns true when signature matches exactly', () => {
      const validSig = generateSignature(testBody, testSecret);
      const result = validateLineSignature(Buffer.from(testBody, 'utf8'), validSig, testSecret);
      expect(result).toBe(true);
    });

    it('returns false when payload is tampered', () => {
      const validSig = generateSignature(testBody, testSecret);
      const tamperedBody = testBody.replace('สวัสดี', 'แอบแก้ข้อความ');
      const result = validateLineSignature(Buffer.from(tamperedBody, 'utf8'), validSig, testSecret);
      expect(result).toBe(false);
    });

    it('returns false when channelSecret is incorrect', () => {
      const validSig = generateSignature(testBody, testSecret);
      const result = validateLineSignature(Buffer.from(testBody, 'utf8'), validSig, 'wrong_secret_123');
      expect(result).toBe(false);
    });

    it('returns false when signature or body is missing', () => {
      expect(validateLineSignature(null, 'sig', testSecret)).toBe(false);
      expect(validateLineSignature(testBody, null, testSecret)).toBe(false);
      expect(validateLineSignature(testBody, 'sig', null)).toBe(false);
    });

    it('returns false safely without throwing when signature length mismatches', () => {
      expect(validateLineSignature(testBody, 'invalid-short-sig', testSecret)).toBe(false);
    });
  });

  describe('verifyLineSignature middleware', () => {
    it('calls next() when valid signature is provided in headers', () => {
      const originalSecret = env.LINE_CHANNEL_SECRET;
      env.LINE_CHANNEL_SECRET = testSecret;

      const validSig = generateSignature(testBody, testSecret);
      const req = {
        headers: { 'x-line-signature': validSig },
        rawBody: Buffer.from(testBody, 'utf8'),
        body: JSON.parse(testBody),
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      verifyLineSignature(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();

      env.LINE_CHANNEL_SECRET = originalSecret;
    });

    it('rejects with 401 when X-Line-Signature is missing', () => {
      const req = {
        headers: {},
        rawBody: Buffer.from(testBody, 'utf8'),
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      verifyLineSignature(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MISSING_LINE_SIGNATURE' })
      );
    });

    it('rejects with 401 when signature is invalid/tampered', () => {
      const originalSecret = env.LINE_CHANNEL_SECRET;
      env.LINE_CHANNEL_SECRET = testSecret;

      const fakeSig = Buffer.from('fake_signature_hash_bytes_1234567890123456').toString('base64');
      const req = {
        headers: { 'x-line-signature': fakeSig },
        rawBody: Buffer.from(testBody, 'utf8'),
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      verifyLineSignature(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'INVALID_LINE_SIGNATURE' })
      );

      env.LINE_CHANNEL_SECRET = originalSecret;
    });
  });
});
