import { query } from '../../db.js';
import { defaultBotSettings } from '../config/defaultBotSettings.js';
import { generateGeminiReply } from './geminiService.js';
import { findServerRelevantKm } from './aiAssistantService.js';
import { isWithinBusinessHours } from '../utils/timeHelpers.js';

let botSettings = { ...defaultBotSettings };

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
      botSettings = { ...defaultBotSettings, ...res.rows[0].config };
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

/**
 * Matches bot reply with prioritized fallback pipeline:
 * 1. Human Handoff -> 2. Keyword Rules -> 3. Welcome Message -> 4. Gemini AI -> 5. Fail-Safe Fallback
 */
export const matchBotReply = async (
  text,
  isNewConv = false,
  customerName = 'คุณลูกค้า',
  recentMessages = [],
  now = new Date()
) => {
  if (!botSettings || !botSettings.isEnabled) return null;

  const cleanText = (text || '').trim().toLowerCase();
  const isOffHours = !isWithinBusinessHours(now, botSettings.businessHours);

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
          const profile = botSettings.companyProfile || {};
          reply = reply
              .replace(/{customer_name}/g, customerName || 'คุณลูกค้า')
              .replace(/{company_name}/g, profile.companyName || botSettings.companyName || 'CusBox360')
              .replace(/{company_phone}/g, profile.phone || '02-123-4567')
              .replace(/{company_email}/g, profile.email || 'sales@cusbox360.co.th')
              .replace(/{company_address}/g, profile.address || '')
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

  // 4. Gemini AI Smart Fallback
  const geminiKey = botSettings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const aiResult = await generateGeminiReply({
        prompt: text,
        recentMessages,
        customerName,
        isOffHours,
        companyName: botSettings.companyName,
        companyProfile: botSettings.companyProfile,
        knowledgeItems: botSettings.knowledgeItems,
        apiKey: geminiKey,
      });

      if (aiResult?.replyText) {
        return {
          replyText: aiResult.replyText,
          type: 'ai',
          isAi: true,
          isOffHours,
        };
      }
    } catch (aiErr) {
      console.warn('[AI Reply Error]:', aiErr.message);
    }
  }

  // 4.5 KM & Company Profile Grounded Fallback
  const matchedKm = findServerRelevantKm(text, botSettings.knowledgeItems);
  if (matchedKm) {
    return {
      replyText: matchedKm.content,
      type: 'km',
      ruleName: `KM: ${matchedKm.title}`,
      isAi: true,
    };
  }
  if (
    botSettings.companyProfile &&
    /บริษัทชื่อ|ชื่อบริษัท|ชื่ออะไร|ทำธุรกิจ|ธุรกิจอะไร|ขายอะไร|บริการอะไร|ติดต่อ|เบอร์โทร|อีเมล|email|ที่อยู่/.test(
      cleanText
    )
  ) {
    const p = botSettings.companyProfile;
    return {
      replyText: `สวัสดีค่ะคุณ${customerName} เราคือ ${p.companyName} ดำเนินธุรกิจ${p.businessType} (${p.description}) ติดต่อได้ที่โทร ${p.phone}, อีเมล ${p.email} หรือที่อยู่ ${p.address} เวลาทำการ ${p.businessHoursText} ค่ะ`,
      type: 'km',
      ruleName: 'KM: Company Profile',
      isAi: true,
    };
  }

  // 5. Fail-Safe Fallback: Never leave the conversation silent
  if (isOffHours && botSettings.offHoursMessageEnabled && botSettings.offHoursText) {
    return {
      replyText: botSettings.offHoursText,
      type: 'off_hours',
      isOffHours: true,
    };
  }

  const defaultFallback =
    botSettings.fallbackMessage ||
    'ขออภัยในความล่าช้าค่ะคุณลูกค้า 🙏 เจ้าหน้าที่ฝ่ายบริการลูกค้าได้รับข้อความแล้วและกำลังเร่งเข้ามาดูแลให้นะคะ';

  return {
    replyText: defaultFallback.replace(/{customer_name}/g, customerName || 'คุณลูกค้า'),
    type: 'fallback',
    isOffHours,
  };
};
