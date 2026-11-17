import { BotAutoReplyRule, BotSettings, CannedResponse } from '../../types';
import { initialBotSettings } from '../../data/botSettings';
import { businessTemplates } from '../../data/businessTemplates';
import { defaultCompanyProfile, defaultKnowledgeItems } from '../../data/templateKnowledgePresets';
import { matchKnowledgeOrCompanyReply } from './knowledgeMerge';
import { ensureScopedBotRules, ensureScopedKnowledgeItems } from './businessScope';

export interface BotTestMatchResult {
  matched: boolean;
  type: 'handoff' | 'rule' | 'welcome' | 'off_hours' | 'km' | 'none';
  rule?: BotAutoReplyRule;
  replyText: string;
  matchedKeyword?: string;
}

export const normalizeBotSettings = (
  raw: Partial<BotSettings>,
  catalog: CannedResponse[]
): BotSettings => ({
  ...initialBotSettings,
  ...raw,
  companyProfile: {
    ...defaultCompanyProfile,
    ...(raw.companyProfile || {}),
  },
  pbxConfig: {
    enabled: initialBotSettings.pbxConfig?.enabled ?? true,
    phoneUrl:
      initialBotSettings.pbxConfig?.phoneUrl ??
      'https://pbx01.cb360.online:5001/phone/index.html',
    windowName: initialBotSettings.pbxConfig?.windowName ?? 'pbx_360_phone',
    outboundPrefix: initialBotSettings.pbxConfig?.outboundPrefix ?? '',
    requireExtension: initialBotSettings.pbxConfig?.requireExtension ?? false,
    fallbackTelUri: initialBotSettings.pbxConfig?.fallbackTelUri ?? true,
    ...(raw.pbxConfig || {}),
  },
  rules: ensureScopedBotRules(
    Array.isArray(raw.rules) ? raw.rules : initialBotSettings.rules,
    businessTemplates,
    catalog
  ),
  knowledgeItems: ensureScopedKnowledgeItems(
    Array.isArray(raw.knowledgeItems) ? raw.knowledgeItems : defaultKnowledgeItems,
    businessTemplates
  ),
});

export const evaluateBotMatch = (
  userText: string,
  scopedSettings: BotSettings,
  cannedResponses: CannedResponse[],
  replaceVariables: (tpl: string, vars?: Record<string, string>) => string,
  customVars?: Record<string, string>
): BotTestMatchResult => {
  if (!scopedSettings.isEnabled) {
    return { matched: false, type: 'none', replyText: 'Bot ปิดใช้งานอยู่ (Inactive)' };
  }
  const cleanInput = userText.trim().toLowerCase();

  if (scopedSettings.humanHandoffEnabled) {
    const handoffHit = scopedSettings.humanHandoffKeywords.some((kw) =>
      cleanInput.includes(kw.trim().toLowerCase())
    );
    if (handoffHit) {
      return { matched: true, type: 'handoff', replyText: scopedSettings.handoffMessage };
    }
  }

  const activeRules = scopedSettings.rules
    .filter((r) => r.isActive)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    for (const kw of rule.keywords) {
      const cleanKw = kw.trim().toLowerCase();
      if (!cleanKw) continue;
      const hit =
        rule.matchType === 'exact' ? cleanInput === cleanKw : cleanInput.includes(cleanKw);
      if (hit) {
        let text = rule.customReplyText;
        if (!text && rule.cannedResponseId) {
          const canned = cannedResponses.find((c) => c.id === rule.cannedResponseId);
          if (canned) text = replaceVariables(canned.content, customVars);
        }
        return {
          matched: true,
          type: 'rule',
          rule,
          replyText: text || 'ไม่มีข้อความตอบกลับที่กำหนดไว้',
          matchedKeyword: kw,
        };
      }
    }
  }

  const kmHit = matchKnowledgeOrCompanyReply(
    userText,
    scopedSettings.companyProfile ?? defaultCompanyProfile,
    scopedSettings.knowledgeItems ?? defaultKnowledgeItems
  );
  if (kmHit.matched) {
    return {
      matched: true,
      type: 'km',
      replyText: kmHit.replyText,
      matchedKeyword: kmHit.matchedTopic,
    };
  }

  return {
    matched: false,
    type: 'none',
    replyText: 'ไม่พบคำสำคัญที่ตรงกับกฎใดๆ ในระบบ',
  };
};
