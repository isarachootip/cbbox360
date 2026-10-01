import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchBotReply, getBotSettings, updateBotSettings } from './botEngineService.js';
import * as geminiService from './geminiService.js';

// Mock db.js query function
vi.mock('../../db.js', () => ({
  query: vi.fn().mockImplementation(async (sql) => {
    if (sql.includes('canned_responses')) {
      return { rows: [{ content: 'กรุณาโอนเงินเข้าบัญชี ธ.กสิกรไทย 123-4-56789-0' }] };
    }
    return { rows: [] };
  }),
}));

describe('Bot Engine Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    updateBotSettings({ isEnabled: true, geminiApiKey: '' });
  });

  it('should detect human handoff keyword and return handoff message', async () => {
    const result = await matchBotReply('ต้องการ ติดต่อเจ้าหน้าที่ ด่วนครับ', false, 'คุณสมชาย');
    expect(result).not.toBeNull();
    expect(result.type).toBe('handoff');
    expect(result.isHandoff).toBe(true);
    expect(result.replyText).toContain('ระบบได้ส่งเรื่องให้เจ้าหน้าที่');
  });

  it('should match keywords like เลขบัญชี or โอนเงิน', async () => {
    const result = await matchBotReply('ขอเลขบัญชีโอนเงินหน่อยครับ', false, 'คุณสมชาย');
    expect(result).not.toBeNull();
    expect(result.type).toBe('rule');
    expect(result.ruleName).toBe('แจ้งช่องทางชำระเงินและเลขบัญชี');
  });

  it('should use Gemini AI when text does not match keywords and apiKey is configured', async () => {
    vi.spyOn(geminiService, 'generateGeminiReply').mockResolvedValueOnce({
      replyText: 'ขออภัยในความล่าช้าค่ะคุณออย แอดมินกำลังดูแลรายการให้อยู่นะคะ',
      isAi: true,
    });

    updateBotSettings({ geminiApiKey: 'valid-gemini-key' });

    const result = await matchBotReply('ทำไมเงียบ', false, 'คุณออย');
    expect(result).not.toBeNull();
    expect(result.type).toBe('ai');
    expect(result.isAi).toBe(true);
    expect(result.replyText).toContain('ขออภัยในความล่าช้า');
  });

  it('should fallback to off-hours message when message sent at 00:39 AM without AI key', async () => {
    // 00:39 AM Thai time (outside 08:30-18:00)
    const midnightDate = new Date('2026-10-08T00:39:00+07:00');

    const result = await matchBotReply(
      'ทำไมเงียบ',
      false,
      'คุณออย',
      [],
      midnightDate
    );

    expect(result).not.toBeNull();
    expect(result.type).toBe('off_hours');
    expect(result.isOffHours).toBe(true);
    expect(result.replyText).toContain('ขณะนี้นอกเวลาทำการ');
  });

  it('should fallback to polite general fallback during daytime when no rule matches', async () => {
    // 10:00 AM Thai time (within business hours)
    const daytimeDate = new Date('2026-10-07T10:00:00+07:00');

    const result = await matchBotReply(
      'มีใครอยู่ไหมครับ',
      false,
      'คุณออย',
      [],
      daytimeDate
    );

    expect(result).not.toBeNull();
    expect(result.type).toBe('fallback');
    expect(result.replyText).toContain('เจ้าหน้าที่ฝ่ายบริการลูกค้าได้รับข้อความแล้ว');
  });

  it('should return null only when bot is explicitly disabled', async () => {
    updateBotSettings({ isEnabled: false });
    const result = await matchBotReply('ทำไมเงียบ', false, 'คุณออย');
    expect(result).toBeNull();
  });
});
