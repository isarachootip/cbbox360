import { describe, it, expect } from 'vitest';
import { buildAiPromptPayload } from '../promptBuilder.js';

describe('promptBuilder - buildAiPromptPayload', () => {
  const sampleMessages = [
    { sender: 'customer', text: 'สวัสดีครับ เบอร์ผม 081-892-5678 ตามออเดอร์ SO-10482', time: '10:30' },
    { sender: 'note', author_name: 'วิภา ส.', text: 'โน้ตภายใน: ลูกค้ารีบใช้ของมาก', time: '10:32', is_private_note: true },
  ];

  it('excludes private notes and masks phone numbers in suggest_reply mode', () => {
    const { systemInstruction, userMessage } = buildAiPromptPayload({
      mode: 'suggest_reply',
      companyName: 'CusBox360',
      agentParticle: 'ครับ',
      customerContext: {
        id: 'C00123',
        name: 'สมชาย ใจดี',
        customerType: 'INDIVIDUAL',
        tier: 'PLATINUM',
      },
      messages: sampleMessages,
      cannedResponses: [
        { shortcut: '/ส่งเลขพัสดุ', title: 'แจ้งเลขพัสดุ', content: 'เลขพัสดุ {tracking_no}', tags: ['พัสดุ'] },
      ],
    });

    expect(systemInstruction).toContain('CusBox360');
    expect(systemInstruction).toContain('ใช้คำลงท้าย "ครับ"');
    expect(systemInstruction).toContain('คุณสมชาย');
    expect(userMessage).not.toContain('081-892-5678');
    expect(userMessage).toContain('XXX-XXX-5678');
    expect(userMessage).not.toContain('โน้ตภายใน: ลูกค้ารีบใช้ของมาก');
  });

  it('includes private notes in summary mode', () => {
    const { userMessage } = buildAiPromptPayload({
      mode: 'summary',
      customerContext: { id: 'C00123', name: 'สมชาย ใจดี', tier: 'PLATINUM' },
      messages: sampleMessages,
    });

    expect(userMessage).toContain('โน้ตภายใน: ลูกค้ารีบใช้ของมาก');
  });

  it('injects custom companyProfile and active knowledgeItems into {knowledge}', () => {
    const { systemInstruction, userMessage } = buildAiPromptPayload({
      mode: 'suggest_reply',
      companyName: 'CarePlus Hospital',
      companyProfile: {
        companyName: 'โรงพยาบาลแคร์พลัส (CarePlus Hospital)',
        businessType: 'โรงพยาบาลเอกชนและศูนย์ตรวจสุขภาพ',
        description: 'ตรวจรักษาโรคทั่วไปและนัดหมายแพทย์',
        phone: '02-099-8888',
        email: 'contact@careplushospital.co.th',
        lineId: '@careplushospital',
        website: 'https://www.careplushospital.co.th',
        address: '199 ถ.สุขุมวิท กรุงเทพฯ',
        businessHoursText: 'เปิดบริการ 24 ชั่วโมง',
      },
      knowledgeItems: [
        {
          id: 'km-1',
          title: 'การเตรียมตัวตรวจสุขภาพ',
          category: 'policies_sla',
          content: 'งดน้ำและอาหาร 8-12 ชั่วโมงก่อนเจาะเลือด',
          isActive: true,
        },
        {
          id: 'km-2',
          title: 'หัวข้อปิดใช้งาน',
          category: 'faq',
          content: 'ข้อมูลที่ไม่ควรแสดง',
          isActive: false,
        },
      ],
      customerContext: { id: 'C00123', name: 'สมชาย ใจดี', tier: 'PLATINUM' },
      messages: sampleMessages,
    });

    const combined = `${systemInstruction}\n${userMessage}`;
    expect(combined).toContain('โรงพยาบาลแคร์พลัส (CarePlus Hospital)');
    expect(combined).toContain('02-099-8888');
    expect(combined).toContain('contact@careplushospital.co.th');
    expect(combined).toContain('งดน้ำและอาหาร 8-12 ชั่วโมงก่อนเจาะเลือด');
    expect(combined).not.toContain('ข้อมูลที่ไม่ควรแสดง');
  });
});
