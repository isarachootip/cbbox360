import { describe, it, expect, vi, afterEach } from 'vitest';
import { customerApi } from './customerApi';
import { mockCustomers } from '../data/customers';

const mockFetch = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.unstubAllGlobals());

describe('customerApi', () => {
  it('lists validated customers from GET /api/customers', async () => {
    const sample = mockCustomers[0];
    vi.stubGlobal('fetch', mockFetch(200, { success: true, customers: [sample] }));
    expect(await customerApi.list()).toEqual({ status: 'ok', customers: [sample] });
  });

  it('creates a customer via POST /api/customers and validates response', async () => {
    const sample = mockCustomers[0];
    vi.stubGlobal('fetch', mockFetch(201, { success: true, customer: sample }));
    expect(await customerApi.create(sample)).toEqual({ status: 'ok', customer: sample });
  });

  it('updates a customer via PUT /api/customers/:id', async () => {
    const sample = { ...mockCustomers[0], email: 'new@example.com' };
    vi.stubGlobal('fetch', mockFetch(200, { success: true, customer: sample }));
    expect(await customerApi.update(sample)).toEqual({ status: 'ok', customer: sample });
  });

  it('returns BAD_RESPONSE when server payload fails schema validation', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, customers: [{ id: 123 }] }));
    expect(await customerApi.list()).toEqual({ status: 'error', code: 'BAD_RESPONSE' });
  });

  it('returns NETWORK_ERROR when fetch throws offline error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await customerApi.create(mockCustomers[0])).toEqual({ status: 'error', code: 'NETWORK_ERROR' });
  });
});
