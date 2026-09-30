import { describe, it, expect, vi } from 'vitest';
import { matchBotReply, getBotSettings } from './botEngineService.js';

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

  it('should return null when no rule matches and not a new conversation', async () => {
    const result = await matchBotReply('xyz123456 random text', false, 'คุณสมชาย');
    expect(result).toBeNull();
  });
});
