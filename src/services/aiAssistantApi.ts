import {
  Customer,
  ChatMessage,
  CannedResponse,
  Ticket,
  SuggestedReplyResult,
  AiSummaryResult,
} from '../types';

export interface AiRequestPayload {
  conversationId: string;
  customer: Customer;
  messages: ChatMessage[];
  openTickets: Ticket[];
  cannedResponses: CannedResponse[];
  agentName?: string;
  userId?: string;
  forceRefresh?: boolean;
}

const getAgentParticle = (agentName = ''): 'ครับ' | 'ค่ะ' => {
  const maleNames = ['ธนพล', 'สมศักดิ์', 'กิตติ', 'ภูมิ', 'นนท์', 'เอก'];
  return maleNames.some((n) => agentName.includes(n)) ? 'ครับ' : 'ค่ะ';
};

const extractCustomerFirstName = (name = 'ลูกค้า'): string => {
  const cleaned = name.replace(/^(คุณ|บจก\.|หจก\.|บมจ\.|บริษัท)\s*/i, '').trim();
  return cleaned.split(/\s+/)[0] || 'ลูกค้า';
};

const buildCustomerContextDto = (customer: Customer, openTickets: Ticket[], messages: ChatMessage[]) => {
  const trackingMsg = [...messages].reverse().find((m) => m.trackingNumber);
  const trackingNumber = trackingMsg?.trackingNumber || 'TH2609-88412';

  const lastOrdersText = `${customer.lastOrderCode || 'SO-10482'} (${customer.lastOrderDaysAgo} วันก่อน, ยอด ฿${(customer.lastOrderAmount || 0).toLocaleString()}, เลขพัสดุ ${trackingNumber})`;
  const openTicketsText =
    openTickets.length > 0
      ? openTickets.map((t) => `${t.id}: ${t.title} (สถานะ: ${t.status}, SLA: ${t.slaFormatted})`).join('; ')
      : 'ไม่มี Ticket ที่เปิดอยู่';

  return {
    id: customer.id,
    name: customer.name,
    customerType: customer.customerType || 'INDIVIDUAL',
    tier: customer.tier,
    lastOrderCode: customer.lastOrderCode,
    trackingNumber,
    lastOrdersText,
    openTicketsText,
    consentLine: customer.consent?.marketingLine ?? true,
  };
};

// Client-side cache when running in pure Vite frontend dev mode
const clientSummaryCache = new Map<string, { messageCount: number; data: AiSummaryResult }>();

export const requestSuggestedReply = async (
  payload: AiRequestPayload
): Promise<SuggestedReplyResult> => {
  const agentParticle = getAgentParticle(payload.agentName);
  const customerContext = buildCustomerContextDto(
    payload.customer,
    payload.openTickets,
    payload.messages
  );

  try {
    const res = await fetch('/api/ai/suggest-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: payload.conversationId,
        userId: payload.userId,
        agentName: payload.agentName,
        agentParticle,
        customerContext,
        messages: payload.messages,
        cannedResponses: payload.cannedResponses,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (_err) {
    // Fallback to client simulation when Express server is not running
  }

  const firstName = extractCustomerFirstName(payload.customer.name);
  const lastCustomerText =
    [...payload.messages].reverse().find((m) => m.sender === 'customer')?.text || '';
  const lower = lastCustomerText.toLowerCase();
  const isEscalate = /ร้องเรียน|ผู้จัดการ|หัวหน้า|ฟ้อง|กฎหมาย|pdpa|ลบข้อมูล|ไม่พอใจ/.test(lower);
  const isQuote = /ใบเสนอราคา|เครื่องพิมพ์|ราคา|สั่งซื้อ/.test(lower);

  if (isQuote) {
    return {
      replies: [
        {
          label: 'รับเรื่องใบเสนอราคา',
          text: `สวัสดี${agentParticle}คุณ${firstName} ยินดีจัดทำใบเสนอราคาให้เลย${agentParticle} รบกวนขอทราบอีเมลสำหรับจัดส่งเอกสารและชื่อผู้ติดต่อด้วยนะ${agentParticle === 'ครับ' ? 'ครับ' : 'คะ'}`,
        },
        {
          label: 'สอบถามสเปกเพิ่มเติม',
          text: `คุณ${firstName}ต้องการให้รวมแพ็กเกจหมึกพิมพ์และบริการติดตั้งหน้างานไว้ในใบเสนอราคาด้วยเลยไหม${agentParticle}?`,
        },
        {
          label: 'ให้ผู้เชี่ยวชาญติดต่อกลับ',
          text: `ในฐานะลูกค้าระดับ ${payload.customer.tier} ขออนุญาตให้เจ้าหน้าที่ฝ่ายขายประจำตัวติดต่อกลับเพื่อเสนอส่วนลดโครงการภายในวันนี้เลย${agentParticle}`,
        },
      ],
      used_canned: ['/ทักทายทั่วไป'],
      missing_info: ['อีเมลผู้รับใบเสนอราคา', 'เงื่อนไขเครดิตเทอมที่ต้องการ'],
      needs_human_check: true,
      escalate: isEscalate,
      logId: `local-${Date.now()}`,
    };
  }

  return {
    replies: [
      {
        label: 'ตอบสถานะพัสดุ',
        text: `ใช่${agentParticle}คุณ${firstName} คำสั่งซื้อ ${payload.customer.lastOrderCode} (เลขพัสดุ ${customerContext.trackingNumber}) ออกจากคลังแล้ว จะจัดส่งถึงพรุ่งนี้ก่อน 12:00 น. ${agentParticle}`,
      },
      {
        label: 'ดูแลพิเศษระดับ VIP',
        text: `คุณ${firstName}วางใจได้เลย${agentParticle} สำหรับลูกค้าระดับ ${payload.customer.tier} เจ้าหน้าที่ได้ประสานขนส่งให้เร่งนำส่งเป็นคิวแรกของวันพรุ่งนี้แล้ว${agentParticle}`,
      },
      {
        label: 'ขอข้อมูลติดต่อหน้างานเพิ่ม',
        text: `เพื่อให้ขนส่งโทรแจ้งก่อนเข้าส่งพรุ่งนี้ได้สะดวกที่สุด คุณ${firstName}ต้องการระบุเบอร์โทรผู้รับหน้างานสำรองไว้ด้วยไหม${agentParticle}?`,
      },
    ],
    used_canned: ['/ส่งเลขพัสดุ'],
    missing_info: ['ตรวจสอบสถานะขนส่งล่าสุดอีกครั้งก่อนกดส่ง'],
    needs_human_check: isEscalate,
    escalate: isEscalate,
    logId: `local-${Date.now()}`,
  };
};

export const requestAiSummary = async (payload: AiRequestPayload): Promise<AiSummaryResult> => {
  const msgCount = payload.messages.length;
  if (!payload.forceRefresh) {
    const cached = clientSummaryCache.get(payload.conversationId);
    if (cached && cached.messageCount === msgCount) {
      return { ...cached.data, cached: true };
    }
  }

  const customerContext = buildCustomerContextDto(
    payload.customer,
    payload.openTickets,
    payload.messages
  );

  try {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: payload.conversationId,
        forceRefresh: payload.forceRefresh,
        userId: payload.userId,
        agentName: payload.agentName,
        customerContext,
        messages: payload.messages,
        cannedResponses: payload.cannedResponses,
      }),
    });

    if (res.ok) {
      const data: AiSummaryResult = await res.json();
      clientSummaryCache.set(payload.conversationId, { messageCount: msgCount, data });
      return data;
    }
  } catch (_err) {
    // Fallback to local summary
  }

  const allText = payload.messages.map((m) => m.text).join(' ');
  const isQuote = /ใบเสนอราคา|เครื่องพิมพ์/.test(allText);

  const fallback: AiSummaryResult = isQuote
    ? {
        summary: `${payload.customer.name} (${payload.customer.tier}) ติดต่อขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro จำนวน 5 เครื่อง ขณะนี้รอเจ้าหน้าที่จัดทำเอกสารเสนอราคาส่งกลับ`,
        intent: 'purchase',
        sentiment: 'positive',
        urgency: 'medium',
        done: ['รับเรื่องขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่อง'],
        pending: ['จัดทำและส่งใบเสนอราคา', 'ยืนยันเงื่อนไขการชำระเงิน'],
        next_step: 'สร้าง Lead ในระบบ Pipeline และส่งใบเสนอราคาให้ลูกค้า',
        suggest_ticket: { create: false, type: '', title: '' },
        suggest_lead: {
          create: true,
          title: `ใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่อง (${payload.customer.name})`,
          est_value: 225000,
        },
        labels: ['ใบเสนอราคา', 'เครื่องพิมพ์'],
        cached: false,
        messageCount: msgCount,
      }
    : {
        summary: `${payload.customer.name} (${payload.customer.tier}) ติดตามคำสั่งซื้อหมึกพิมพ์ ${payload.customer.lastOrderCode} ที่ต้องใช้ด่วน แอดมินแจ้งเลขพัสดุ ${customerContext.trackingNumber} แล้ว ลูกค้าถามย้ำเรื่องกำหนดส่งพรุ่งนี้`,
        intent: 'order_status',
        sentiment: 'neutral',
        urgency: 'high',
        done: [`ตรวจสอบคำสั่งซื้อ ${payload.customer.lastOrderCode}`, `แจ้งเลขพัสดุ ${customerContext.trackingNumber}`],
        pending: ['ยืนยันว่าสินค้าจะถึงมือลูกค้าพรุ่งนี้ก่อนเที่ยง', 'โทรติดตาม Deal ต่อสัญญาตาม Private Note'],
        next_step: 'ตอบยืนยันกำหนดส่งพรุ่งนี้ให้ลูกค้ามั่นใจ และประสานฝ่ายขายโทรตามเรื่องต่อสัญญา',
        suggest_ticket: {
          create: true,
          type: 'Inquiry',
          title: `ติดตามการจัดส่งด่วน ${payload.customer.lastOrderCode} (${customerContext.trackingNumber})`,
        },
        suggest_lead: {
          create: true,
          title: `ต่อสัญญาหมึกพิมพ์รายปี (${payload.customer.name})`,
          est_value: 85000,
        },
        labels: ['จัดส่งด่วน', 'ติดตามพัสดุ'],
        cached: false,
        messageCount: msgCount,
      };

  clientSummaryCache.set(payload.conversationId, { messageCount: msgCount, data: fallback });
  return fallback;
};

export const updateAiUsageLog = async (
  logId: string,
  update: {
    selectedLabel?: string;
    selectedText?: string;
    finalSentText?: string;
    wasEdited?: boolean;
  }
): Promise<void> => {
  if (!logId) return;
  try {
    await fetch(`/api/ai/logs/${encodeURIComponent(logId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
  } catch (_err) {
    // Ignore telemetry network errors in offline demo mode
  }
};
