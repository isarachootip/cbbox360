/**
 * Fallback Customer Context, Conversations & Canned Responses for Server-Side AI
 * Ensures POST /api/ai/suggest-reply { conversationId } and POST /api/ai/summary { conversationId }
 * work standalone even if PostgreSQL is offline or Frontend only sends conversationId.
 */

export const SERVER_CUSTOMER_PROFILES = {
  C00123: {
    id: 'C00123',
    name: 'สมชาย ใจดี',
    customerType: 'INDIVIDUAL',
    tier: 'PLATINUM',
    lastOrderCode: 'SO-10482',
    trackingNumber: 'TH2609-88412',
    lastOrdersText: 'SO-10482 (14 ก.ย., กำลังจัดส่ง, เลขพัสดุ TH2609-88412)',
    openTicketsText: 'TK-2310 (ติดตามสถานะจัดส่งหมึกพิมพ์ด่วน, สถานะ: Open, SLA เหลือ 3 ชม.)',
    consentLine: true,
  },
  C00124: {
    id: 'C00124',
    name: 'บจก. นำชัยการพิมพ์',
    customerType: 'CORPORATE',
    tier: 'GOLD',
    lastOrderCode: 'SO-10455',
    trackingNumber: 'TH2609-77102',
    lastOrdersText: 'SO-10455 (10 ก.ย., จัดส่งสำเร็จ, เลขพัสดุ TH2609-77102)',
    openTicketsText: 'ไม่มี Ticket ที่เปิดอยู่',
    consentLine: true,
  },
  C00125: {
    id: 'C00125',
    name: 'หจก. สยามออฟฟิศซัพพลาย',
    customerType: 'CORPORATE',
    tier: 'SILVER',
    lastOrderCode: 'SO-10390',
    trackingNumber: 'TH2609-60911',
    lastOrdersText: 'SO-10390 (2 ก.ย., จัดส่งสำเร็จ, เลขพัสดุ TH2609-60911)',
    openTicketsText: 'TK-2314 (ขอเคลมตลับหมึกชำรุด 2 กล่อง, สถานะ: Pending, SLA เหลือ 5 ชม.)',
    consentLine: true,
  },
};

export const SERVER_CONV_FALLBACKS = {
  'conv-1': {
    id: 'conv-1',
    customerId: 'C00123',
    customerName: 'สมชาย ใจดี',
    customerTier: 'PLATINUM',
    assignedTo: 'วิภา ส.',
    messages: [
      { id: 'm-1', sender: 'customer', text: 'สวัสดีครับ สั่งหมึกพิมพ์ไปเมื่อ 14 ก.ย. เลข SO-10482 ครับ', time: '10:32' },
      { id: 'm-2', sender: 'customer', text: 'ของจะถึงเมื่อไหร่ครับ ต้องใช้ด่วน', time: '10:33' },
      { id: 'm-3', sender: 'note', author_name: 'วิภา ส.', text: '@ธนพล ลูกค้า Platinum มี Deal ต่อสัญญาค้างอยู่ ช่วยโทรตามหลังปิดแชทนี้ด้วย', time: '10:35', is_private_note: true },
      { id: 'm-4', sender: 'agent', author_name: 'วิภา ส.', text: 'สวัสดีค่ะคุณสมชาย ตรวจสอบแล้ว SO-10482 ออกจากคลังวันนี้ จะถึงพรุ่งนี้ก่อน 12:00 ค่ะ เลขพัสดุ TH2609-88412', time: '10:38', tracking_number: 'TH2609-88412' },
      { id: 'm-5', sender: 'customer', text: 'ของจะถึงพรุ่งนี้ใช่ไหมครับ', time: '10:41' },
    ],
  },
  'conv-2': {
    id: 'conv-2',
    customerId: 'C00124',
    customerName: 'บจก. นำชัยการพิมพ์',
    customerTier: 'GOLD',
    assignedTo: 'ธนพล ก.',
    messages: [
      { id: 'm-201', sender: 'customer', text: 'ขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่องครับ', time: '10:36' },
    ],
  },
};

export const inferAgentParticle = (agentName = '') => {
  const maleNames = ['ธนพล', 'สมศักดิ์', 'กิตติ', 'ภูมิ', 'นนท์', 'เอก'];
  if (maleNames.some((n) => agentName.includes(n))) {
    return 'ครับ';
  }
  return 'ค่ะ';
};
