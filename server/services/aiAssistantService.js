import { buildAiPromptPayload, extractFirstName } from '../utils/promptBuilder.js';
import {
  parseAndValidateSuggestReply,
  parseAndValidateSummary,
} from '../utils/aiSchemaValidator.js';

const GEMINI_JSON_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Calls Gemini with responseMimeType: "application/json", 15s timeout, and 1 retry on schema failure.
 */
export const callGeminiStructured = async ({
  systemInstruction,
  userMessage,
  temperature = 0.4,
  apiKey,
  validatorFn,
  timeoutMs = 15000,
}) => {
  const executeSingleAttempt = async (retryHint = '') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${GEMINI_JSON_URL}?key=${encodeURIComponent(apiKey.trim())}`;
      const fullPrompt = `${systemInstruction}\n\n${userMessage}${
        retryHint ? `\n\n[หมายเหตุแก้ไข JSON ครั้งก่อน: ${retryHint}]` : ''
      }`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: 900,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        return { valid: false, error: `HTTP ${response.status}: ${errBody.slice(0, 120)}` };
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) {
        return { valid: false, error: 'Empty candidate text from Gemini' };
      }

      return validatorFn(rawText);
    } catch (err) {
      clearTimeout(timer);
      return { valid: false, error: err.message || 'Network/Timeout error' };
    }
  };

  // First attempt
  const firstTry = await executeSingleAttempt();
  if (firstTry.valid) {
    return { ok: true, data: firstTry.data, attempts: 1 };
  }

  // Retry 1 time as required by spec
  const secondTry = await executeSingleAttempt(firstTry.error);
  if (secondTry.valid) {
    return { ok: true, data: secondTry.data, attempts: 2 };
  }

  return {
    ok: false,
    error: `Schema/API validation failed after retry: ${secondTry.error}`,
    attempts: 2,
  };
};

/**
 * Generates contextual fallback when GEMINI_API_KEY is not configured in local dev/demo environment,
 * while strictly honoring the prompt schema rules.
 */
export const buildSmartLocalSuggestReply = ({
  customerContext = {},
  messages = [],
  agentParticle = 'ค่ะ',
}) => {
  const firstName = extractFirstName(customerContext.name || customerContext.customerName || 'ลูกค้า');
  const lastCustomerMsg = [...messages].reverse().find((m) => m.sender === 'customer')?.text || '';
  const lower = lastCustomerMsg.toLowerCase();
  const orderCode = customerContext.lastOrderCode || 'SO-10482';
  const trackingNo = customerContext.trackingNumber || 'TH2609-88412';

  const isEscalate =
    /ร้องเรียน|ผู้จัดการ|หัวหน้า|ฟ้อง|กฎหมาย|pdpa|ลบข้อมูล|คุยกับคน|ไม่พอใจมาก/.test(lower);
  const isRefundOrDiscount = /คืนเงิน|ส่วนลด|ลดราคา|ชดเชย|เพิ่มวงเงิน|ยกเว้นค่าปรับ/.test(lower);
  const isQuote = /ใบเสนอราคา|สั่งซื้อ|ราคา|เครื่องพิมพ์/.test(lower);

  if (isQuote) {
    return {
      replies: [
        {
          label: 'รับเรื่องใบเสนอราคา',
          text: `สวัสดี${agentParticle}คุณ${firstName} ยินดีจัดทำใบเสนอราคาให้เลย${agentParticle} รบกวนขอทราบอีเมลและชื่อผู้ติดต่อเพื่อจัดส่งเอกสารให้โดยด่วนนะ${agentParticle === 'ครับ' ? 'ครับ' : 'คะ'}`,
        },
        {
          label: 'สอบถามสเปกเพิ่มเติม',
          text: `คุณ${firstName}ต้องการใช้งานเครื่องพิมพ์สำหรับงานสีหรือขาวดำเป็นหลัก และต้องการรวมแพ็กเกจหมึกพิมพ์รายปีด้วยไหม${agentParticle}?`,
        },
        {
          label: 'ให้ฝ่ายขายติดต่อกลับ',
          text: `เนื่องจากคุณ${firstName}เป็นลูกค้าระดับ ${customerContext.tier || 'VIP'} ขออนุญาตให้เจ้าหน้าที่ฝ่ายขายประจำตัวติดต่อกลับเพื่อเสนอราคาพิเศษภายในวันนี้เลยนะ${agentParticle === 'ครับ' ? 'ครับ' : 'คะ'}`,
        },
      ],
      used_canned: ['/ทักทายทั่วไป'],
      missing_info: ['อีเมลสำหรับจัดส่งใบเสนอราคา', 'เงื่อนไขเครดิตเทอมที่ต้องการ'],
      needs_human_check: true,
      escalate: isEscalate,
    };
  }

  return {
    replies: [
      {
        label: 'ยืนยันสถานะพัสดุ',
        text: `ใช่${agentParticle}คุณ${firstName} คำสั่งซื้อ ${orderCode} (เลขพัสดุ ${trackingNo}) ออกจากคลังเรียบร้อยแล้ว จะจัดส่งถึงพรุ่งนี้ก่อนเวลา 12:00 น. ${agentParticle}`,
      },
      {
        label: 'แจ้งติดตามเร่งด่วน VIP',
        text: `คุณ${firstName}ไม่ต้องกังวลใจนะ${agentParticle === 'ครับ' ? 'ครับ' : 'คะ'} ในฐานะลูกค้าระดับ ${customerContext.tier || 'PLATINUM'} เจ้าหน้าที่ได้ประสานขนส่งให้เร่งนำจ่ายเป็นคิวแรกของวันพรุ่งนี้แล้ว${agentParticle}`,
      },
      {
        label: 'ขอเบอร์สำรองหน้างาน',
        text: `เพื่อให้ขนส่งติดต่อคุณ${firstName}ได้ราบรื่นที่สุดในวันพรุ่งนี้ ต้องการให้ระบุเบอร์โทรผู้รับหน้างานเพิ่มเติมไว้ด้วยไหม${agentParticle}?`,
      },
    ],
    used_canned: ['/ส่งเลขพัสดุ'],
    missing_info: isRefundOrDiscount
      ? ['ต้องให้หัวหน้างานอนุมัติเงื่อนไขการชดเชย/ส่วนลดก่อนตอบ']
      : ['ตรวจสอบสถานะล่าสุดจากระบบขนส่งอีกครั้งก่อนกดส่ง'],
    needs_human_check: isRefundOrDiscount || isEscalate,
    escalate: isEscalate,
  };
};

export const buildSmartLocalSummary = ({ customerContext = {}, messages = [] }) => {
  const customerName = customerContext.name || customerContext.customerName || 'คุณสมชาย ใจดี';
  const tier = customerContext.tier || 'PLATINUM';
  const allText = messages.map((m) => m.text || '').join(' ');

  const isQuote = /ใบเสนอราคา|เครื่องพิมพ์/.test(allText);
  if (isQuote) {
    return {
      summary: `${customerName} (ระดับ ${tier}) ติดต่อขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro จำนวน 5 เครื่อง ขณะนี้รอเจ้าหน้าที่ฝ่ายขายจัดทำและส่งใบเสนอราคาให้ลูกค้า`,
      intent: 'purchase',
      sentiment: 'positive',
      urgency: 'medium',
      done: ['รับเรื่องความต้องการสั่งซื้อเครื่องพิมพ์รุ่น Pro 5 เครื่อง'],
      pending: ['จัดทำและส่งใบเสนอราคาให้ลูกค้า', 'ยืนยันเงื่อนไขราคาและกำหนดส่งมอบ'],
      next_step: 'สร้าง Lead ใน Sales Pipeline และส่งใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่อง',
      suggest_ticket: { create: false, type: '', title: '' },
      suggest_lead: {
        create: true,
        title: `ใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่อง (${customerName})`,
        est_value: 225000,
      },
      labels: ['ใบเสนอราคา', 'เครื่องพิมพ์', tier],
    };
  }

  return {
    summary: `${customerName} (ระดับ ${tier}) ติดตามสถานะคำสั่งซื้อ SO-10482 ที่ต้องใช้งานด่วน เจ้าหน้าที่แจ้งเลขพัสดุ TH2609-88412 แล้ว ลูกค้าถามย้ำเพื่อยืนยันว่าของจะถึงพรุ่งนี้`,
    intent: 'order_status',
    sentiment: 'neutral',
    urgency: 'high',
    done: ['ตรวจสอบคำสั่งซื้อ SO-10482', 'แจ้งเลขพัสดุ TH2609-88412 และกำหนดส่งพรุ่งนี้ก่อน 12:00 น.'],
    pending: ['ยืนยันกำหนดส่งถึงมือลูกค้าวันพรุ่งนี้', 'โทรติดตามเรื่องต่อสัญญาตาม Private Note'],
    next_step: 'ตอบยืนยันกำหนดส่งพรุ่งนี้ให้ลูกค้ามั่นใจ และประสานทีม Sales โทรเรื่องต่อสัญญา',
    suggest_ticket: {
      create: true,
      type: 'Inquiry',
      title: `ติดตามการจัดส่งด่วน SO-10482 (พัสดุ TH2609-88412)`,
    },
    suggest_lead: {
      create: true,
      title: `ต่อสัญญาหมึกพิมพ์รายปี (${customerName})`,
      est_value: 85000,
    },
    labels: ['จัดส่งด่วน', 'ติดตามพัสดุ', 'ต่อสัญญา'],
  };
};
