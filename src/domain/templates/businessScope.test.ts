import { describe, it, expect } from 'vitest';
import { businessTemplates } from '../../data/businessTemplates';
import { mockCannedResponses } from '../../data/cannedResponses';
import { initialBotSettings } from '../../data/botSettings';
import { defaultKnowledgeItems } from '../../data/templateKnowledgePresets';
import {
  ensureScopedBotRules,
  ensureScopedCannedCatalog,
  ensureScopedKnowledgeItems,
  filterBotRulesByBusiness,
  filterCannedByBusiness,
  filterKnowledgeByBusiness,
} from './businessScope';
import { evaluateBotMatch, normalizeBotSettings } from './botMatcher';
import { replaceTemplateVariables, resolveActiveCompanyProfile } from './variableReplacer';

describe('businessScope — isolated templates, keywords, and KM per business', () => {
  it('seeds all presets and exposes only contact_center + common when switched to contact_center', () => {
    const catalog = ensureScopedCannedCatalog(mockCannedResponses, businessTemplates);
    const active = filterCannedByBusiness(catalog, 'contact_center');

    const shortcuts = active.map((c) => c.shortcut);
    expect(shortcuts).toContain('/open-case');
    expect(shortcuts).toContain('/case-status');
    expect(shortcuts).toContain('/verify-kyc');
    expect(shortcuts).toContain('/ทักทายทั่วไป'); // common greeting stays available
    expect(shortcuts).not.toContain('/เงื่อนไขเครดิต'); // B2B wholesale excluded
    expect(shortcuts).not.toContain('/appoint'); // hospital excluded
    expect(shortcuts).not.toContain('/track'); // logistics excluded

    // Active business templates come before common templates so Inbox Quick Bar slice(0, 8) shows them first
    expect(active[0].businessScope).toBe('contact_center');
  });

  it('preserves custom edits in contact_center across switches to hospital and back', () => {
    const seeded = ensureScopedCannedCatalog(mockCannedResponses, businessTemplates);
    const editedCatalog = seeded.map((item) =>
      item.shortcut === '/open-case'
        ? { ...item, content: 'ข้อความแก้ไขพิเศษสำหรับศูนย์ Contact Center' }
        : item
    );

    // Switch to hospital -> contact_center item hidden, hospital item visible
    const hospitalView = filterCannedByBusiness(editedCatalog, 'hospital');
    expect(hospitalView.some((c) => c.shortcut === '/appoint')).toBe(true);
    expect(hospitalView.some((c) => c.shortcut === '/open-case')).toBe(false);

    // Switch back to contact_center -> custom edit is intact even after re-running ensureScopedCannedCatalog
    const rehydrated = ensureScopedCannedCatalog(editedCatalog, businessTemplates);
    const ccView = filterCannedByBusiness(rehydrated, 'contact_center');
    const openCase = ccView.find((c) => c.shortcut === '/open-case');
    expect(openCase?.content).toBe('ข้อความแก้ไขพิเศษสำหรับศูนย์ Contact Center');
  });

  it('isolates bot keyword rules per business so B2B keywords do not collide with contact_center', () => {
    const catalog = ensureScopedCannedCatalog(mockCannedResponses, businessTemplates);
    const rules = ensureScopedBotRules(initialBotSettings.rules, businessTemplates, catalog);

    const ccRules = filterBotRulesByBusiness(rules, 'contact_center');
    const ccRuleNames = ccRules.map((r) => r.name);

    expect(ccRuleNames.some((n) => n.includes('[Contact Center]'))).toBe(true);
    expect(ccRuleNames.some((n) => n.includes('ทักทาย'))).toBe(true); // common
    expect(ccRuleNames.some((n) => n.includes('เครดิตเทอม'))).toBe(false); // B2B hidden
    expect(ccRuleNames.some((n) => n.includes('[Hospital]'))).toBe(false); // Hospital hidden
  });

  it('isolates AI knowledge items per active business', () => {
    const allKm = ensureScopedKnowledgeItems(defaultKnowledgeItems, businessTemplates);
    const ccKm = filterKnowledgeByBusiness(allKm, 'contact_center');

    expect(ccKm.length).toBeGreaterThan(0);
    expect(ccKm.every((k) => k.businessScope === 'contact_center' || k.businessScope === 'common')).toBe(true);
  });

  it('matches Contact Center keywords with dynamic SLA variables and ignores B2B keywords', () => {
    const catalog = ensureScopedCannedCatalog(mockCannedResponses, businessTemplates);
    const normalized = normalizeBotSettings(initialBotSettings, catalog);
    const activeCanned = filterCannedByBusiness(catalog, 'contact_center');
    const profile = resolveActiveCompanyProfile('contact_center');
    const scopedBot = {
      ...normalized,
      companyProfile: profile,
      rules: filterBotRulesByBusiness(normalized.rules, 'contact_center'),
      knowledgeItems: filterKnowledgeByBusiness(normalized.knowledgeItems ?? [], 'contact_center'),
    };

    const hit = evaluateBotMatch(
      'ต้องการแจ้งปัญหาระบบขัดข้อง เปิดเคสให้หน่อยครับ',
      scopedBot,
      activeCanned,
      (tpl, vars) => replaceTemplateVariables(tpl, profile, vars),
      { ticket_id: 'TK-9001', sla_tier: 'VIP (1 ชม.)', sla_time: 'ภายใน 1 ชั่วโมง' }
    );
    expect(hit.matched).toBe(true);
    expect(hit.type).toBe('rule');
    expect(hit.replyText).toContain('TK-9001');
    expect(hit.replyText).toContain('VIP (1 ชม.)');

    const b2bLeak = evaluateBotMatch(
      'ขอเงื่อนไขเครดิตเทอมหน่อย',
      scopedBot,
      activeCanned,
      (tpl, vars) => replaceTemplateVariables(tpl, profile, vars)
    );
    expect(b2bLeak.matched).toBe(false);
  });
});
