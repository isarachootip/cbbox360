import { describe, it, expect, vi } from 'vitest';
import { createConsentController } from './consentController.js';

const sampleDsr = {
  id: 'DSR-2601',
  customerId: 'C00123',
  customerName: 'สมชาย ใจดี',
  requestType: 'ACCESS_EXPORT',
  channel: 'LINE LIFF',
  reason: 'ขอสำเนาข้อมูลส่วนบุคคล',
  status: 'Open',
  slaDaysLeft: 28,
  assignee: 'สมศักดิ์ บ.',
  createdAt: '2026-11-17',
};

const samplePolicy = {
  id: 'pol-v21',
  version: 'v2.1',
  title: 'ประกาศความเป็นส่วนตัว CusBox360',
  effectiveDate: '2026-11-01',
  summary: 'ครอบคลุมการเก็บข้อมูลการตลาดและบริการหลังการขาย',
  lineConsentMessage: 'กรุณายืนยันความยินยอม PDPA ที่ลิงก์ https://liff.line.me/cb360-pdpa',
  isActive: true,
};

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('consentController — PostgreSQL PDPA DSR & Policy Persistence', () => {
  it('rejects invalid DSR payload with 400 INVALID_DSR_PAYLOAD', async () => {
    const repo = { listDsr: vi.fn(), listPolicies: vi.fn(), upsertDsr: vi.fn(), upsertPolicy: vi.fn() };
    const ctrl = createConsentController({ repo, audit: vi.fn() });
    const res = makeRes();

    await ctrl.upsertDsr({ body: { dsrRequest: { id: '' } }, user: { id: 'usr-1', role: 'admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_DSR_PAYLOAD' }));
  });

  it('saves valid DSR request and returns overview with audit logging', async () => {
    const dsrStore = [];
    const policyStore = [];
    const repo = {
      listDsr: vi.fn(async () => dsrStore),
      listPolicies: vi.fn(async () => policyStore),
      upsertDsr: vi.fn(async (d) => { dsrStore.unshift(d); return d; }),
      upsertPolicy: vi.fn(async (p) => { policyStore.unshift(p); return p; }),
    };
    const audit = vi.fn(async () => {});
    const ctrl = createConsentController({ repo, audit });

    const resDsr = makeRes();
    await ctrl.upsertDsr(
      { body: { dsrRequest: sampleDsr }, user: { id: 'usr-admin', role: 'admin' }, ip: '127.0.0.1' },
      resDsr
    );
    expect(resDsr.status).toHaveBeenCalledWith(200);
    expect(resDsr.json).toHaveBeenCalledWith({ success: true, dsrRequest: sampleDsr });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPSERT_DSR_REQUEST' }));

    const resPol = makeRes();
    await ctrl.upsertPolicy(
      { body: { policy: samplePolicy }, user: { id: 'usr-admin', role: 'admin' }, ip: '127.0.0.1' },
      resPol
    );
    expect(resPol.status).toHaveBeenCalledWith(200);

    const resOverview = makeRes();
    await ctrl.getOverview({}, resOverview);
    expect(resOverview.status).toHaveBeenCalledWith(200);
    expect(resOverview.json).toHaveBeenCalledWith({
      success: true,
      dsrRequests: [sampleDsr],
      policies: [samplePolicy],
    });
  });
});
