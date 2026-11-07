import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGeminiReply, buildGeminiPrompt } from './geminiService.js';

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null if no apiKey is provided', async () => {
    const res = await generateGeminiReply({
      prompt: 'ทำไมเงียบ',
      recentMessages: [],
      customerName: 'คุณออย',
      isOffHours: false,
      apiKey: '',
    });
    expect(res).toBeNull();
  });

  it('should build a prompt with conversation history, customer name, and off-hours notice', () => {
    const systemPrompt = buildGeminiPrompt({
      prompt: 'ทำไมเงียบ',
      recentMessages: [
        { sender: 'customer', text: 'สวัสดี' },
        { sender: 'agent', text: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ' },
        { sender: 'customer', text: 'ทำไมเงียบ' },
      ],
      customerName: 'คุณออย',
      isOffHours: true,
    });

    expect(systemPrompt).toContain('คุณออย');
    expect(systemPrompt).toContain('ทำไมเงียบ');
    expect(systemPrompt).toContain('นอกเวลาทำการ');
    expect(systemPrompt).toContain('CusBox360');
  });

  it('should include companyProfile (business type, phone, email) and active knowledgeItems in buildGeminiPrompt', () => {
    const promptText = buildGeminiPrompt({
      prompt: 'บริษัทชื่ออะไร ทำธุรกิจอะไร ขอเบอร์โทรกับอีเมลหน่อยครับ',
      recentMessages: [],
      customerName: 'คุณสมชาย',
      isOffHours: false,
      companyName: 'SpeedXpress 3PL',
      companyProfile: {
        companyName: 'บจก. สปีดเอ็กซ์เพรส โลจิสติกส์',
        businessType: 'ขนส่งพัสดุด่วนและคลังสินค้าครบวงจร',
        description: 'ส่งด่วนทั่วไทย เก็บเงินปลายทาง COD',
        phone: '02-777-9000',
        email: 'cs@speedxpress.co.th',
        address: 'นิคมบางพลี สมุทรปราการ',
        businessHoursText: '08:00 - 20:00 น.',
      },
      knowledgeItems: [
        {
          id: 'km-logis-1',
          title: 'ค่าธรรมเนียม COD',
          content: 'ค่าธรรมเนียม COD 2% โอนคืน T+1',
          isActive: true,
        },
      ],
    });

    expect(promptText).toContain('บจก. สปีดเอ็กซ์เพรส โลจิสติกส์');
    expect(promptText).toContain('ขนส่งพัสดุด่วนและคลังสินค้าครบวงจร');
    expect(promptText).toContain('02-777-9000');
    expect(promptText).toContain('cs@speedxpress.co.th');
    expect(promptText).toContain('ค่าธรรมเนียม COD 2% โอนคืน T+1');
  });

  it('should call Gemini API and return generated reply text on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'ขออภัยในความล่าช้าเป็นอย่างยิ่งค่ะคุณออย ขณะนี้อยู่นอกเวลาทำการ เจ้าหน้าที่จะติดต่อกลับในเวลา 08:30 น. นะคะ',
                },
              ],
            },
          },
        ],
      }),
    });

    const res = await generateGeminiReply({
      prompt: 'ทำไมเงียบ',
      recentMessages: [{ sender: 'customer', text: 'ทำไมเงียบ' }],
      customerName: 'คุณออย',
      isOffHours: true,
      apiKey: 'test-gemini-key',
    });

    expect(res).not.toBeNull();
    expect(res.replyText).toContain('ขออภัยในความล่าช้า');
    expect(res.isAi).toBe(true);
  });

  it('should handle API failure gracefully and return null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'API key invalid',
    });

    const res = await generateGeminiReply({
      prompt: 'ทำไมเงียบ',
      recentMessages: [],
      customerName: 'คุณออย',
      isOffHours: false,
      apiKey: 'invalid-key',
    });

    expect(res).toBeNull();
  });

  it('should handle fetch throw or timeout gracefully and return null', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const res = await generateGeminiReply({
      prompt: 'ทำไมเงียบ',
      recentMessages: [],
      customerName: 'คุณออย',
      isOffHours: false,
      apiKey: 'test-key',
    });

    expect(res).toBeNull();
  });
});
