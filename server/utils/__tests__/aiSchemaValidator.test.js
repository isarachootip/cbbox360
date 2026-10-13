import { describe, it, expect } from 'vitest';
import {
  parseAndValidateSuggestReply,
  parseAndValidateSummary,
} from '../aiSchemaValidator.js';

describe('aiSchemaValidator - parseAndValidateSuggestReply', () => {
  it('validates a compliant suggest-reply JSON payload', () => {
    const validJson = JSON.stringify({
      replies: [
        { label: 'ตอบสถานะพัสดุ', text: 'สวัสดีค่ะคุณสมชาย พัสดุจะถึงพรุ่งนี้ค่ะ' },
        { label: 'ขอข้อมูลเพิ่ม', text: 'รบกวนแจ้งหมายเลขคำสั่งซื้อเพิ่มเติมนะคะ' },
      ],
      used_canned: ['/ส่งเลขพัสดุ'],
      missing_info: ['เวลาจัดส่งที่แน่นอน'],
      needs_human_check: false,
      escalate: false,
    });

    const result = parseAndValidateSuggestReply(validJson);
    expect(result.valid).toBe(true);
    expect(result.data.replies).toHaveLength(2);
    expect(result.data.used_canned).toEqual(['/ส่งเลขพัสดุ']);
    expect(result.data.escalate).toBe(false);
  });

  it('strips markdown code fences if Gemini wraps JSON in ```json', () => {
    const fenced = '```json\n' + JSON.stringify({
      replies: [{ label: 'ตอบตรง', text: 'ข้อความตอบ' }],
      used_canned: [],
      missing_info: [],
      needs_human_check: true,
      escalate: true,
    }) + '\n```';

    const result = parseAndValidateSuggestReply(fenced);
    expect(result.valid).toBe(true);
    expect(result.data.escalate).toBe(true);
  });

  it('rejects payload with empty replies or missing required boolean fields', () => {
    const invalidJson = JSON.stringify({
      replies: [],
      used_canned: [],
      missing_info: [],
    });

    const result = parseAndValidateSuggestReply(invalidJson);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects malformed JSON string', () => {
    const result = parseAndValidateSuggestReply('{ broken json ');
    expect(result.valid).toBe(false);
  });
});

describe('aiSchemaValidator - parseAndValidateSummary', () => {
  it('validates a compliant AI summary JSON payload', () => {
    const validSummary = JSON.stringify({
      summary: 'คุณสมชาย (PLATINUM) ติดตามสถานะคำสั่งซื้อ SO-10482 แอดมินแจ้งเลขพัสดุแล้ว รอยืนยันถึงพรุ่งนี้',
      intent: 'order_status',
      sentiment: 'neutral',
      urgency: 'medium',
      done: ['แจ้งเลขพัสดุ TH2609-88412'],
      pending: ['ยืนยันว่าสินค้าจะถึงพรุ่งนี้ก่อนเที่ยง'],
      next_step: 'ยืนยันเวลาจัดส่งกับขนส่งและแจ้งลูกค้า',
      suggest_ticket: { create: false, type: '', title: '' },
      suggest_lead: { create: true, title: 'ต่อสัญญาหมึกพิมพ์รายปี', est_value: 45000 },
      labels: ['จัดส่ง', 'ด่วน'],
    });

    const result = parseAndValidateSummary(validSummary);
    expect(result.valid).toBe(true);
    expect(result.data.intent).toBe('order_status');
    expect(result.data.suggest_lead.create).toBe(true);
    expect(result.data.labels).toHaveLength(2);
  });

  it('rejects summary with invalid intent, sentiment, or urgency enum', () => {
    const invalidEnum = JSON.stringify({
      summary: 'สรุปข้อความ',
      intent: 'unknown_intent',
      sentiment: 'very_happy',
      urgency: 'critical',
      done: [],
      pending: [],
      next_step: 'โทรหาลูกค้า',
      suggest_ticket: { create: false, type: '', title: '' },
      suggest_lead: { create: false, title: '', est_value: null },
      labels: [],
    });

    const result = parseAndValidateSummary(invalidEnum);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects summary when labels exceed 3 items', () => {
    const tooManyLabels = JSON.stringify({
      summary: 'สรุปข้อความ',
      intent: 'general',
      sentiment: 'positive',
      urgency: 'low',
      done: [],
      pending: [],
      next_step: 'ปิดแชท',
      suggest_ticket: { create: false, type: '', title: '' },
      suggest_lead: { create: false, title: '', est_value: null },
      labels: ['a', 'b', 'c', 'd'],
    });

    const result = parseAndValidateSummary(tooManyLabels);
    expect(result.valid).toBe(false);
  });
});

describe('aiAssistantService - callGeminiStructured retry on schema error', () => {
  it('retries once when first Gemini response fails schema validation and succeeds on second try', async () => {
    const { callGeminiStructured } = await import('../../services/aiAssistantService.js');
    const origFetch = global.fetch;
    let callCount = 0;

    global.fetch = async () => {
      callCount += 1;
      if (callCount === 1) {
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"invalid_schema": true}' }] } }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      replies: [{ label: 'ตอบสำเร็จหลังลองใหม่', text: 'สวัสดีค่ะคุณสมชาย' }],
                      used_canned: [],
                      missing_info: [],
                      needs_human_check: false,
                      escalate: false,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    try {
      const out = await callGeminiStructured({
        systemInstruction: 'sys',
        userMessage: 'user',
        temperature: 0.4,
        apiKey: 'fake-key',
        validatorFn: parseAndValidateSuggestReply,
      });

      expect(callCount).toBe(2);
      expect(out.ok).toBe(true);
      expect(out.attempts).toBe(2);
      expect(out.data.replies[0].label).toBe('ตอบสำเร็จหลังลองใหม่');
    } finally {
      global.fetch = origFetch;
    }
  });
});

