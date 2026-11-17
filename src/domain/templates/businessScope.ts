import {
  BotAutoReplyRule,
  BusinessScope,
  BusinessTemplateId,
  BusinessTemplatePreset,
  CannedResponse,
} from '../../types';
import { KnowledgeItem } from '../../types/knowledge';

const COMMON_CANNED_IDS = new Set(['cr-1', 'cr-2', 'cr-3', 'cr-4', 'cr-13']);
const COMMON_RULE_IDS = new Set(['rule-greeting', 'rule-hours']);

const inferCannedScope = (
  item: CannedResponse,
  presets: BusinessTemplatePreset[]
): BusinessScope => {
  if (item.businessScope) return item.businessScope;
  if (COMMON_CANNED_IDS.has(item.id)) return 'common';
  const matchedPreset = presets.find((p) =>
    p.cannedResponses.some(
      (pc) => pc.id === item.id || pc.shortcut.toLowerCase() === item.shortcut.toLowerCase()
    )
  );
  return matchedPreset ? matchedPreset.id : 'b2b_wholesale';
};

/**
 * Normalizes existing canned responses with `businessScope` and seeds missing preset templates
 * across all businesses without overwriting any custom edits already saved in `stored`.
 */
export const ensureScopedCannedCatalog = (
  stored: CannedResponse[],
  presets: BusinessTemplatePreset[]
): CannedResponse[] => {
  const normalized = stored.map((item) => ({
    ...item,
    businessScope: inferCannedScope(item, presets),
  }));

  const seenKey = new Set(
    normalized.map((c) => `${c.businessScope ?? 'b2b_wholesale'}::${c.shortcut.toLowerCase()}`)
  );

  const additions: CannedResponse[] = [];
  const today = '2026-10-01';

  for (const preset of presets) {
    for (const tpl of preset.cannedResponses) {
      const scope: BusinessScope = tpl.businessScope ?? preset.id;
      const key = `${scope}::${tpl.shortcut.toLowerCase()}`;
      if (!seenKey.has(key)) {
        seenKey.add(key);
        additions.push({
          ...tpl,
          businessScope: scope,
          usageCount: 0,
          createdAt: today,
          updatedAt: today,
        });
      }
    }
  }

  return [...normalized, ...additions];
};

/**
 * Returns active business templates FIRST (so Inbox Quick Bar `slice(0, 8)` shows industry-relevant chips),
 * followed by shared `'common'` greetings/hours.
 */
export const filterCannedByBusiness = (
  catalog: CannedResponse[],
  activeBusiness: BusinessTemplateId
): CannedResponse[] => {
  const businessItems = catalog.filter((c) => c.businessScope === activeBusiness);
  const commonItems = catalog.filter((c) => c.businessScope === 'common');
  return [...businessItems, ...commonItems];
};

const inferRuleScope = (
  rule: BotAutoReplyRule,
  presets: BusinessTemplatePreset[]
): BusinessScope => {
  if (rule.businessScope) return rule.businessScope;
  if (COMMON_RULE_IDS.has(rule.id)) return 'common';
  const matchedPreset = presets.find((p) =>
    p.botRules.some((pr) => rule.id === pr.id || rule.id.startsWith(`${pr.id}-`) || rule.name === pr.name)
  );
  return matchedPreset ? matchedPreset.id : 'b2b_wholesale';
};

export const ensureScopedBotRules = (
  stored: BotAutoReplyRule[],
  presets: BusinessTemplatePreset[],
  catalog: CannedResponse[]
): BotAutoReplyRule[] => {
  const normalized = stored.map((r) => ({
    ...r,
    businessScope: inferRuleScope(r, presets),
  }));

  const seenNames = new Set(
    normalized.map((r) => `${r.businessScope ?? 'b2b_wholesale'}::${r.name}`)
  );

  const additions: BotAutoReplyRule[] = [];
  for (const preset of presets) {
    for (const rule of preset.botRules) {
      const scope: BusinessScope = rule.businessScope ?? preset.id;
      const key = `${scope}::${rule.name}`;
      if (seenNames.has(key)) continue;
      seenNames.add(key);

      const presetCanned = preset.cannedResponses.find((c) => c.id === rule.cannedResponseId);
      const resolvedCanned = presetCanned
        ? catalog.find(
            (c) =>
              c.businessScope === scope &&
              c.shortcut.toLowerCase() === presetCanned.shortcut.toLowerCase()
          )
        : undefined;

      additions.push({
        ...rule,
        businessScope: scope,
        cannedResponseId: resolvedCanned?.id ?? rule.cannedResponseId,
      });
    }
  }

  return [...normalized, ...additions];
};

export const filterBotRulesByBusiness = (
  rules: BotAutoReplyRule[],
  activeBusiness: BusinessTemplateId
): BotAutoReplyRule[] =>
  rules.filter((r) => r.businessScope === activeBusiness || r.businessScope === 'common');

export const ensureScopedKnowledgeItems = (
  stored: KnowledgeItem[],
  presets: BusinessTemplatePreset[]
): KnowledgeItem[] => {
  const normalized: KnowledgeItem[] = stored.map((k) => ({
    ...k,
    businessScope: k.businessScope ?? k.templateId ?? 'b2b_wholesale',
  }));

  const seenIds = new Set(normalized.map((k) => k.id));
  const additions: KnowledgeItem[] = [];

  for (const preset of presets) {
    for (const km of preset.knowledgeItems) {
      if (seenIds.has(km.id)) continue;
      seenIds.add(km.id);
      additions.push({
        ...km,
        templateId: preset.id,
        businessScope: km.businessScope ?? preset.id,
      });
    }
  }

  return [...normalized, ...additions];
};

export const filterKnowledgeByBusiness = (
  items: KnowledgeItem[],
  activeBusiness: BusinessTemplateId
): KnowledgeItem[] =>
  items.filter((k) => {
    const scope = k.businessScope ?? k.templateId ?? 'b2b_wholesale';
    return scope === activeBusiness || scope === 'common';
  });
