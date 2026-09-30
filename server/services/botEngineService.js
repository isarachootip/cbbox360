import { query } from '../../db.js';

let botSettings = {
  isEnabled: true,
  botName: 'CusBox AI Assistant',
  operatingMode: 'always',
  welcomeMessageEnabled: true,
  welcomeCannedResponseId: 'cr-1',
  offHoursMessageEnabled: true,
  offHoursText:
    'สวัสดีค่ะ ขณะนี้นอกเวลาทำการของศูนย์บริการ CusBox360 (เวลาทำการ จ.-ศ. 08:30 - 18:00 น.) คุณลูกค้าสามารถฝากข้อความหรือคำถามไว้ได้เลยนะคะ เจ้าหน้าที่จะรีบติดต่อกลับในเวลาทำการค่ะ 🙏',
  businessHours: {
    start: '08:30',
    end: '18:00',
    workdays: [1, 2, 3, 4, 5, 6],
  },
  humanHandoffEnabled: true,
  humanHandoffKeywords: [
    'ติดต่อเจ้าหน้าที่', 'คุยกับคน', 'พนักงาน', 'แอดมิน', 'คุยกับแอดมิน', 'ขอคุยกับคน', 'ติดต่อพนักงาน', 'agent', 'human',
  ],
  handoffMessage:
    'ระบบได้ส่งเรื่องให้เจ้าหน้าที่ฝ่ายบริการลูกค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะเข้ามาดูแลและตอบกลับแชทนี้โดยเร็วที่สุดนะคะ กรุณารอสักครู่ค่ะ 👩‍💼',
  rules: [
    {
      id: 'rule-bank',
      name: 'แจ้งช่องทางชำระเงินและเลขบัญชี',
      triggerType: 'keyword',
      keywords: ['เลขบัญชี', 'โอนเงิน', 'ชำระเงิน', 'จ่ายเงิน', 'ช่องทางชำระ', 'เลขที่บัญชี', 'โอนที่ไหน', 'บัญชี'],
      matchType: 'contains',
      cannedResponseId: 'cr-10',
      isActive: true,
      priority: 1,
    },
    {
      id: 'rule-tracking',
      name: 'แจ้งเลขพัสดุและติดตามจัดส่ง',
      triggerType: 'keyword',
      keywords: ['เลขพัสดุ', 'พัสดุ', 'ส่งของหรือยัง', 'ส่งของยัง', 'เช็คพัสดุ', 'track', 'tracking', 'ตามของ'],
      matchType: 'contains',
      cannedResponseId: 'cr-11',
      isActive: true,
      priority: 2,
    },
    {
      id: 'rule-delivery-time',
      name: 'รอบจัดส่งสินค้าและการตัดรอบ',
      triggerType: 'keyword',
      keywords: ['รอบส่ง', 'ตัดรอบ', 'ส่งวันไหน', 'ส่งกี่โมง', 'กี่วันถึง', 'ได้รับเมื่อไหร่', 'รอบจัดส่ง'],
      matchType: 'contains',
      cannedResponseId: 'cr-12',
      isActive: true,
      priority: 3,
    },
    {
      id: 'rule-slip',
      name: 'ขอสลิปหลักฐานการโอนเงิน',
      triggerType: 'keyword',
      keywords: ['โอนแล้ว', 'ส่งสลิป', 'แนบสลิป', 'จ่ายแล้ว', 'โอนเงินเรียบร้อย'],
      matchType: 'contains',
      cannedResponseId: 'cr-6',
      isActive: true,
      priority: 4,
    },
    {
      id: 'rule-hours',
      name: 'สอบถามเวลาทำการและที่ตั้ง',
      triggerType: 'keyword',
      keywords: ['เปิดกี่โมง', 'ปิดกี่โมง', 'เวลาทำการ', 'เปิดวันไหน', 'เบอร์ติดต่อ', 'สำนักงาน'],
      matchType: 'contains',
      cannedResponseId: 'cr-13',
      isActive: true,
      priority: 5,
    },
    {
      id: 'rule-warranty',
      name: 'ประกันสินค้าและเงื่อนไขเปลี่ยนคืน',
      triggerType: 'keyword',
      keywords: ['เคลม', 'ประกัน', 'สินค้าชำรุด', 'เปลี่ยนสินค้า', 'พัง', 'มีประกันไหม', 'สินค้าเสีย', 'ส่งซ่อม'],
      matchType: 'contains',
      cannedResponseId: 'cr-14',
      isActive: true,
      priority: 6,
    },
    {
      id: 'rule-tax',
      name: 'ขอใบกำกับภาษีและใบเสร็จรับเงิน',
      triggerType: 'keyword',
      keywords: ['ใบกำกับภาษี', 'ใบเสร็จ', 'tax id', 'ออกบิล', 'ขอใบกำกับ', 'ภพ20', 'หัก ณ ที่จ่าย'],
      matchType: 'contains',
      cannedResponseId: 'cr-9',
      isActive: true,
      priority: 7,
    },
    {
      id: 'rule-credit',
      name: 'เงื่อนไขการขอเครดิตเทอม',
      triggerType: 'keyword',
      keywords: ['เครดิต', 'credit term', 'วงเงินเครดิต', 'ขอเครดิต', 'ขอผ่อน', 'วางบิล'],
      matchType: 'contains',
      cannedResponseId: 'cr-15',
      isActive: true,
      priority: 8,
    },
    {
      id: 'rule-address',
      name: 'ขอที่อยู่และเบอร์โทรจัดส่ง',
      triggerType: 'keyword',
      keywords: ['ส่งที่ไหน', 'แก้ที่อยู่', 'เปลี่ยนที่อยู่', 'ที่อยู่จัดส่ง'],
      matchType: 'contains',
      cannedResponseId: 'cr-5',
      isActive: true,
      priority: 9,
    },
  ],
};

export const initBotSettingsFromDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        id TEXT PRIMARY KEY,
        config JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const res = await query(`SELECT config FROM bot_settings WHERE id = 'default' LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].config) {
      botSettings = res.rows[0].config;
      console.log('🤖 [Bot Settings] Loaded configuration from database');
    } else {
      await query(
        `INSERT INTO bot_settings (id, config) VALUES ('default', $1) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(botSettings)]
      );
    }
  } catch (err) {
    console.warn('⚠️ [Bot Settings DB Init Warning]:', err.message);
  }
};

export const getBotSettings = () => botSettings;

export const updateBotSettings = async (newConfig) => {
  botSettings = { ...botSettings, ...newConfig };
  try {
    await query(
      `INSERT INTO bot_settings (id, config, updated_at)
       VALUES ('default', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET config = $1, updated_at = NOW()`,
      [JSON.stringify(botSettings)]
    );
  } catch (dbErr) {
    console.warn('⚠️ [Bot Settings DB Save Error]:', dbErr.message);
  }
  return botSettings;
};

export const matchBotReply = async (text, isNewConv, customerName) => {
  if (!botSettings || !botSettings.isEnabled) return null;

  const cleanText = (text || '').trim().toLowerCase();

  // 1. Human handoff check
  if (botSettings.humanHandoffEnabled) {
    const isHandoff = botSettings.humanHandoffKeywords.some((k) =>
      cleanText.includes(k.trim().toLowerCase())
    );
    if (isHandoff) {
      return {
        replyText: botSettings.handoffMessage,
        type: 'handoff',
        isHandoff: true,
      };
    }
  }

  // 2. Keyword rules check
  const activeRules = (botSettings.rules || [])
    .filter((r) => r.isActive)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  for (const rule of activeRules) {
    for (const kw of rule.keywords || []) {
      const cleanKw = kw.trim().toLowerCase();
      if (!cleanKw) continue;
      const hit = rule.matchType === 'exact' ? cleanText === cleanKw : cleanText.includes(cleanKw);
      if (hit) {
        let reply = rule.customReplyText;
        if (!reply && rule.cannedResponseId) {
          try {
            const crRes = await query('SELECT content FROM canned_responses WHERE id = $1 LIMIT 1', [
              rule.cannedResponseId,
            ]);
            if (crRes.rows.length > 0) {
              reply = crRes.rows[0].content;
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (reply) {
          reply = reply
            .replace(/{customer_name}/g, customerName || 'คุณลูกค้า')
            .replace(/{order_code}/g, 'SO-10482')
            .replace(/{tracking_no}/g, 'TH2609-88412');
          return { replyText: reply, type: 'rule', ruleName: rule.name, matchedKeyword: kw };
        }
      }
    }
  }

  // 3. Welcome message on new conversation
  if (isNewConv && botSettings.welcomeMessageEnabled) {
    let welcomeText = null;
    if (botSettings.welcomeCannedResponseId) {
      try {
        const crRes = await query('SELECT content FROM canned_responses WHERE id = $1 LIMIT 1', [
          botSettings.welcomeCannedResponseId,
        ]);
        if (crRes.rows.length > 0) {
          welcomeText = crRes.rows[0].content.replace(/{customer_name}/g, customerName || 'คุณลูกค้า');
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (welcomeText) {
      return { replyText: welcomeText, type: 'welcome' };
    }
  }

  return null;
};
