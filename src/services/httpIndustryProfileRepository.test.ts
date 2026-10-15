import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHttpIndustryProfileRepository } from './httpIndustryProfileRepository';

const patient = {
  kind: 'hospital', hn: 'HN-1001', bloodType: 'O', drugAllergies: ['Penicillin'],
  chronicConditions: [], insurancePolicies: [],
};

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.unstubAllGlobals());

describe('HttpIndustryProfileRepository', () => {
  const repo = createHttpIndustryProfileRepository();

  it('returns full profile with access level', async () => {
    vi.stubGlobal('fetch', respond(200, { success: true, access: 'nurse', profile: patient }));
    expect(await repo.get('C1', 'hospital')).toEqual({ access: 'nurse', profile: patient, redacted: null });
  });

  it('returns the redacted shape for roles without medical access', async () => {
    const redacted = { kind: 'hospital', redacted: true, hn: 'HN-1001', hasDrugAllergy: true };
    vi.stubGlobal('fetch', respond(200, { success: true, access: 'redacted', profile: redacted }));
    expect(await repo.get('C1', 'hospital')).toEqual({ access: 'redacted', profile: null, redacted });
  });

  it('reports an error instead of pretending no profile exists', async () => {
    vi.stubGlobal('fetch', respond(503, { success: false, error: 'PROFILE_UNAVAILABLE' }));
    const result = await repo.get('C1', 'hospital');
    expect(result.profile).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('maps forbidden nurse fields to a readable error', async () => {
    vi.stubGlobal('fetch', respond(403, { success: false, error: 'FORBIDDEN_FIELDS', fields: ['chronicConditions'] }));
    const result = await repo.save('C1', patient as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].message).toContain('chronicConditions');
  });

  it('validates locally before sending (no request for invalid data)', async () => {
    const fetchMock = respond(200, {});
    vi.stubGlobal('fetch', fetchMock);
    const result = await repo.save('C1', { ...patient, hn: '!' } as never);
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
