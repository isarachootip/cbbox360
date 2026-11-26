import { describe, it, expect } from 'vitest';
import { computeCreditPortfolioSummary } from './creditKpiHelpers';
import { isBusinessTemplateId } from '../templates/businessTemplateStorage';
import {
  ensureScopedBotRules,
  ensureScopedCannedCatalog,
  filterBotRulesByBusiness,
  filterCannedByBusiness,
} from '../templates/businessScope';
import { businessTemplates } from '../../data/businessTemplates';
import { parseCallLogRecords } from '../telephony/callLogHelpers';
import { loadTemplateSeedBundle } from '../../../core/server/template-engine/templateSeedLoader.js';

describe('consumer_finance frontend scoping, KPI portfolio summary & call-log schema parity', () => {
  it('recognizes consumer_finance as a valid BusinessTemplateId and scopes its canned responses & bot rules', () => {
    expect(isBusinessTemplateId('consumer_finance')).toBe(true);
    expect(isBusinessTemplateId('unknown_industry')).toBe(false);

    const catalog = ensureScopedCannedCatalog([], businessTemplates);
    const cfCanned = filterCannedByBusiness(catalog, 'consumer_finance');
    expect(cfCanned.map((c) => c.shortcut)).toEqual(
      expect.arrayContaining(['/sg-apply', '/unlock-phone', '/pay-qr', '/ptp-confirm', '/singer-care'])
    );

    const rules = ensureScopedBotRules([], businessTemplates, catalog);
    const cfRules = filterBotRulesByBusiness(rules, 'consumer_finance');
    expect(cfRules.length).toBeGreaterThanOrEqual(3);
  });

  it('computes accurate portfolio totals & aging buckets for singer-sgc while preserving default wholesale mock KPIs', () => {
    const bundle = loadTemplateSeedBundle('consumer_finance');
    const sgcSummary = computeCreditPortfolioSummary(bundle.creditAccounts, false);
    expect(sgcSummary.totalReceivablesText).toBe('฿452,400');
    expect(sgcSummary.overdueText).toBe('฿25,400');
    expect(sgcSummary.riskCustomerCountText).toBe('2 ราย');

    const defaultSummary = computeCreditPortfolioSummary(bundle.creditAccounts, true);
    expect(defaultSummary.totalReceivablesText).toBe('฿18.60M');
  });

  it('validates consumer_finance seed.yaml callLogs cleanly through Zod parseCallLogRecords', () => {
    const bundle = loadTemplateSeedBundle('consumer_finance');
    const parsed = parseCallLogRecords(bundle.callLogs);
    expect(parsed).toHaveLength(bundle.callLogs.length);
    expect(parsed.some((c) => c.direction === 'inbound')).toBe(true);
    expect(parsed.some((c) => c.direction === 'outbound')).toBe(true);
  });
});
