import { describe, it, expect, vi, afterEach } from 'vitest';
import { consentApi } from './consentApi';
import type { ConsentPolicyTemplate, DsrRequest } from '../types';

const sampleDsr: DsrRequest = {
  id: 'DSR-2601',
  customerId: 'C00123',
  customerName: 'สมชาย ใจดี',
  requestType: 'ACCESS_EXPORT',
  channel: 'LINE LIFF',
  reason: 'ขอสำเนาข้อมูล',
  status: 'Open',
  slaDaysLeft: 28,
  assignee: 'สมศักดิ์ บ.',
  createdAt: '2026-11-17',
};

const samplePolicy: ConsentPolicyTemplate = {
  id: 'pol-v21',
  version: 'v2.1',
  title: 'ประกาศความเป็นส่วนตัว CusBox360',
  effectiveDate: '2026-11-01',
  summary: 'สรุปนโยบาย PDPA',
  lineConsentMessage: 'ยืนยันความยินยอม PDPA',
  isActive: true,
};

const mockFetch = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.unstubAllGlobals());

describe('consentApi', () => {
  it('fetches and validates consent overview from GET /api/consent', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, dsrRequests: [sampleDsr], policies: [samplePolicy] }));
    expect(await consentApi.getOverview()).toEqual({
      status: 'ok',
      dsrRequests: [sampleDsr],
      policies: [samplePolicy],
    });
  });

  it('saves DSR request and policy via POST endpoints', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, dsrRequest: sampleDsr }));
    expect(await consentApi.saveDsr(sampleDsr)).toEqual({ status: 'ok', dsrRequest: sampleDsr });

    vi.stubGlobal('fetch', mockFetch(200, { success: true, policy: samplePolicy }));
    expect(await consentApi.savePolicy(samplePolicy)).toEqual({ status: 'ok', policy: samplePolicy });
  });

  it('handles BAD_RESPONSE and NETWORK_ERROR cleanly', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, dsrRequests: [{ bad: true }], policies: [] }));
    expect(await consentApi.getOverview()).toEqual({ status: 'error', code: 'BAD_RESPONSE' });

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await consentApi.saveDsr(sampleDsr)).toEqual({ status: 'error', code: 'NETWORK_ERROR' });
  });
});
