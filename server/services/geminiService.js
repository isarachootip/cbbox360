/**
 * Gemini AI Smart Auto-Reply Service
 * Generates context-aware, empathetic customer service replies
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Builds grounding prompt for Gemini model
 */
export const buildGeminiPrompt = ({
  prompt,
  recentMessages = [],
  customerName = 'คุณลูกค้า',
  isOffHours = false,
  companyName = 'CusBox360',
}) => {
  const historyText = recentMessages
    .slice(-8)
    .map((m) => `${m.sender === 'customer' ? customerName : 'แอดมิน/บอท'}: ${m.text || ''}`)
    .join('\n');

  return `คุณคือผู้ช่วยบริการลูกค้าอัจฉริยะ (AI Customer Care Assistant) ของบริษัท "${companyName}"
บุคลิก: สุภาพ อ่อนน้อม ใส่ใจ เป็นมืออาชีพ ตอบด้วยภาษาไทยที่นุ่มนวล (ใช้ คะ/ค่ะ)
ชื่อลูกค้าที่กำลังคุยด้วย: ${customerName}

บริบทเวลาทำการ:
${
  isOffHours
    ? '- [สำคัญ] ขณะนี้เป็น "นอกเวลาทำการ" (ศูนย์บริการเปิด จ.-ศ. 08:30 - 18:00 น.) หากลูกค้าถามข้อสงสัยทั่วไปสามารถตอบได้ แต่ต้องระบุแจ้งลูกค้าอย่างสุภาพว่าขณะนี้นอกเวลาทำการ และทีมงานเจ้าหน้าที่จะเข้ามาประสานงานติดตามรายการต่อในเวลาทำการ (08:30 น.)'
    : '- ขณะนี้อยู่ในเวลาทำการตามปกติ'
}

ประวัติการสนทนาล่าสุด:
${historyText || '(ไม่มีประวัติก่อนหน้า)'}

ข้อความล่าสุดจากลูกค้า: "${prompt}"

คำแนะนำในการตอบ:
1. หากลูกค้าถามว่า "ทำไมเงียบ", "มีใครอยู่ไหม", หรือรอนาน: ขออภัยในความล่าช้าด้วยความจริงใจ ให้ความมั่นใจว่าระบบและทีมงานได้รับข้อความแล้ว และยินดีดูแลทันที
2. ตอบกระชับ ชัดเจน ไม่เกิน 2-4 ประโยค ไม่ใช้คำตอบแบบหุ่นยนต์แข็งทื่อ
3. ไม่ให้สัญญาหรือตกลงเรื่องเงินหรือการเคลมที่อยู่นอกเหนืออำนาจ
4. ส่งเฉพาะข้อความที่จะส่งตอบลูกค้าใน LINE เท่านั้น (ไม่ต้องใส่คำนำ เช่น "คำตอบ:")`;
};

/**
 * Generates an AI response using Gemini Flash API
 * @param {Object} params
 * @param {string} params.prompt
 * @param {Array} [params.recentMessages]
 * @param {string} [params.customerName]
 * @param {boolean} [params.isOffHours]
 * @param {string} [params.apiKey]
 * @returns {Promise<{ replyText: string, isAi: boolean } | null>}
 */
export const generateGeminiReply = async ({
  prompt,
  recentMessages = [],
  customerName = 'คุณลูกค้า',
  isOffHours = false,
  apiKey = process.env.GEMINI_API_KEY,
}) => {
  if (!apiKey || !prompt?.trim()) {
    return null;
  }

  const promptContent = buildGeminiPrompt({
    prompt,
    recentMessages,
    customerName,
    isOffHours,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5s max

  try {
    const url = `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptContent }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 250,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Gemini API Error]: HTTP ${response.status} - ${errText.slice(0, 150)}`);
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!candidateText) {
      return null;
    }

    return {
      replyText: candidateText,
      isAi: true,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Gemini Fetch Error]: ${err.message}`);
    return null;
  }
};
