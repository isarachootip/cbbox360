import { describe, it, expect } from 'vitest';
import {
  computeConsentKpis,
  filterConsentCustomers,
  resolveCustomerConsent,
} from '../src/domain/consent/consentMetrics';
import {
  applyDsrAutomationToCustomer,
  buildCustomerPortabilityCsv,
  buildCustomerPortabilityPayload,
} from '../src/domain/consent/dsrExporter';
import {
  loadStoredConsentPolicies,
  loadStoredDsrRequests,
  saveStoredConsentPolicies,
  saveStoredDsrRequests,
} from '../src/domain/consent/consentStorage';
import { createMemoryStorage } from '../src/services/industryProfileRepository';
import { mockCustomers } from '../src/data/customers';
import type { ConsentPolicyTemplate, DsrRequest } from '../src/types/consent';

describe('Consent Metrics & Filtering', () => {
  it('resolves default extended consent flags cleanly when optional fields are absent', () => {
    const resolved = resolveCustomerConsent(mockCustomers[0]);
    expect(resolved.marketingLine).toBe(true);
    expect(resolved.marketingEmail).toBe(true);
    expect(resolved.marketingSms).toBe(false);
    expect(resolved.marketingPhone).toBe(true);
    expect(resolved.profilingAnalytics).toBe(true);
    expect(resolved.sensitiveMedical).toBe(false);
    expect(resolved.policyVersion).toBe('v2.1');
  });

  it('computes 4 operational PDPA KPIs accurately from customers and DSR queue', () => {
    const sampleDsr: DsrRequest[] = [
      {
        id: 'DSR-2601',
        customerId: 'C00123',
        customerName: 'สมชาย ใจดี',
        requestType: 'ACCESS_EXPORT',
        channel: 'LINE LIFF',
        reason: 'ขอสำเนาข้อมูล',
        status: 'Open',
        slaDaysLeft: 3,
        assignee: 'สมศักดิ์ บ.',
        createdAt: '2026-11-15',
      },
      {
        id: 'DSR-2602',
        customerId: 'C00125',
        customerName: 'Pim Chanida',
        requestType: 'WITHDRAW_CONSENT',
        channel: 'Web Form',
        reason: 'งดรับข่าวสาร',
        status: 'Completed',
        slaDaysLeft: 25,
        assignee: 'อนุชา จ.',
        createdAt: '2026-11-10',
        resolvedAt: '2026-11-11',
      },
      {
        id: 'DSR-2603',
        customerId: 'C00128',
        customerName: 'Tanawat K.',
        requestType: 'ERASURE_ANONYMIZE',
        channel: 'Email',
        reason: 'ขอลบข้อมูล',
        status: 'Overdue',
        slaDaysLeft: -2,
        assignee: 'สมศักดิ์ บ.',
        createdAt: '2026-10-10',
      },
    ];

    const kpis = computeConsentKpis(mockCustomers, sampleDsr);
    expect(kpis.totalCustomers).toBe(mockCustomers.length);
    expect(kpis.optInCount).toBeGreaterThan(0);
    expect(kpis.optInRatePercent).toBeGreaterThan(0);
    expect(kpis.lineOptInCount).toBe(
      mockCustomers.filter((c) => c.consent.marketingLine).length
    );
    expect(kpis.pendingDsrCount).toBe(2); // Open + Overdue
    expect(kpis.urgentSlaCount).toBe(2); // slaDaysLeft <= 5 (3 and -2) and not Completed
  });

  it('filters customers by search query and consent filter preset', () => {
    const lineOnly = filterConsentCustomers(mockCustomers, '', 'line_opt_in');
    expect(lineOnly.every((c) => c.consent.marketingLine)).toBe(true);

    const optedOut = filterConsentCustomers(mockCustomers, '', 'all_opted_out');
    expect(
      optedOut.every(
        (c) =>
          !c.consent.marketingLine &&
          !c.consent.marketingEmail &&
          !c.consent.marketingSms
      )
    ).toBe(true);

    const byName = filterConsentCustomers(mockCustomers, 'สมชาย', 'all');
    expect(byName.some((c) => c.id === 'C00123')).toBe(true);
  });
});

describe('DSR Automated Actions & Data Portability Exporter', () => {
  it('revokes all marketing channels when executing WITHDRAW_CONSENT DSR', () => {
    const patch = applyDsrAutomationToCustomer(mockCustomers[0], 'WITHDRAW_CONSENT');
    expect(patch.consent?.marketingLine).toBe(false);
    expect(patch.consent?.marketingEmail).toBe(false);
    expect(patch.consent?.marketingSms).toBe(false);
    expect(patch.consent?.marketingPhone).toBe(false);
  });

  it('revokes all consents including profiling & sensitive medical on ERASURE_ANONYMIZE', () => {
    const patch = applyDsrAutomationToCustomer(mockCustomers[0], 'ERASURE_ANONYMIZE');
    expect(patch.consent?.marketingLine).toBe(false);
    expect(patch.consent?.profilingAnalytics).toBe(false);
    expect(patch.consent?.sensitiveMedical).toBe(false);
    expect(patch.email).toBe('');
  });

  it('builds structured portability JSON and UTF-8 CSV for ACCESS_EXPORT', () => {
    const payload = buildCustomerPortabilityPayload(mockCustomers[0]);
    expect(payload.customerId).toBe('C00123');
    expect(payload.standard).toContain('PDPA');
    expect(payload.personalData.fullName).toBe('สมชาย ใจดี');

    const csv = buildCustomerPortabilityCsv([mockCustomers[0]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('C00123');
    expect(csv).toContain('สมชาย ใจดี');
  });
});

describe('Consent Storage (DSR & Policy Persistence)', () => {
  it('persists and reloads DSR requests and Privacy Policies with corruption safety', () => {
    const storage = createMemoryStorage();
    const dsrList: DsrRequest[] = [
      {
        id: 'DSR-2610',
        customerId: 'C00123',
        customerName: 'สมชาย ใจดี',
        requestType: 'ACCESS_EXPORT',
        channel: 'LINE LIFF',
        reason: 'ขอไฟล์ข้อมูล',
        status: 'Open',
        slaDaysLeft: 29,
        assignee: 'สมศักดิ์ บ.',
        createdAt: '2026-11-17',
      },
    ];
    const policies: ConsentPolicyTemplate[] = [
      {
        id: 'pol-v21',
        version: 'v2.1',
        title: 'ประกาศความเป็นส่วนตัวสำหรับลูกค้า CusBox360',
        effectiveDate: '2026-11-01',
        summary: 'ครอบคลุมการเก็บข้อมูลการตลาด วิเคราะห์โปรไฟล์ และข้อมูลสุขภาพ ม.26',
        lineConsentMessage: 'กรุณายืนยันความยินยอม PDPA ที่ลิงก์ https://liff.line.me/cb360-pdpa',
        isActive: true,
      },
    ];

    saveStoredDsrRequests(storage, dsrList);
    saveStoredConsentPolicies(storage, policies);

    expect(loadStoredDsrRequests(storage, [])).toEqual(dsrList);
    expect(loadStoredConsentPolicies(storage, [])).toEqual(policies);

    storage.setItem('cb360_consent_dsr', '{broken');
    expect(loadStoredDsrRequests(storage, dsrList)).toEqual(dsrList);
  });
});
