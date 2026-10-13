import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '../piiMasker.js';

describe('piiMasker - maskSensitiveData', () => {
  it('masks 13-digit Thai National ID (contiguous and hyphenated) keeping last 4 digits', () => {
    const raw1 = 'เลขบัตรประชาชนของผมคือ 1100400123456 ครับ';
    const res1 = maskSensitiveData(raw1);
    expect(res1).not.toContain('1100400123456');
    expect(res1).toContain('3456');
    expect(res1).toMatch(/X+3456/);

    const raw2 = 'บัตร ปชช. 1-1004-00123-45-6 ช่วยตรวจสอบด้วย';
    const res2 = maskSensitiveData(raw2);
    expect(res2).not.toContain('1-1004-00123-45-6');
    expect(res2).toContain('3456');
  });

  it('masks Thai phone numbers (10 digits and 9 digits) keeping last 4 digits', () => {
    const raw = 'ติดต่อเบอร์ 081-892-5678 หรือ 0891234567 หรือเบอร์ออฟฟิศ 02-123-9876 ได้เลย';
    const res = maskSensitiveData(raw);
    expect(res).not.toContain('081-892-5678');
    expect(res).not.toContain('0891234567');
    expect(res).not.toContain('02-123-9876');
    expect(res).toContain('5678');
    expect(res).toContain('4567');
    expect(res).toContain('9876');
  });

  it('masks 10-to-12-digit bank account numbers keeping last 4 digits', () => {
    const raw = 'โอนเข้าเลขที่บัญชี 012-3-45678-9 หรือบัญชี 1234567890 ครับ';
    const res = maskSensitiveData(raw);
    expect(res).not.toContain('012-3-45678-9');
    expect(res).not.toContain('1234567890');
    expect(res).toContain('6789');
    expect(res).toContain('7890');
  });

  it('does NOT mask order codes, ticket IDs, or tracking numbers', () => {
    const raw = 'คำสั่งซื้อ SO-10482 เลขพัสดุ TH2609-88412 และ Ticket TK-2310';
    const res = maskSensitiveData(raw);
    expect(res).toContain('SO-10482');
    expect(res).toContain('TH2609-88412');
    expect(res).toContain('TK-2310');
  });

  it('handles empty or non-string values safely', () => {
    expect(maskSensitiveData('')).toBe('');
    expect(maskSensitiveData(null)).toBe('');
    expect(maskSensitiveData(undefined)).toBe('');
  });
});
