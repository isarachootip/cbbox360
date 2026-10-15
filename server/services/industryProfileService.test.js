import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIndustryProfileService } from './industryProfileService.js';

const patient = {
  kind: 'hospital', hn: 'HN-1001', bloodType: 'O', drugAllergies: ['Penicillin'],
  chronicConditions: ['เบาหวาน'], insurancePolicies: [],
};
const user = (role) => ({ id: `u-${role}`, username: role, role });

let store;
let audit;
let svc;

beforeEach(() => {
  store = new Map();
  audit = vi.fn(async () => {});
  svc = createIndustryProfileService({
    repo: {
      get: async (c, k) => store.get(`${c}:${k}`) ?? null,
      upsert: async (c, k, data) => store.set(`${c}:${k}`, data),
    },
    audit,
  });
  store.set('C1:hospital', patient);
});

describe('getProfile (hospital)', () => {
  it('doctor gets the full profile and the view is audited', async () => {
    const r = await svc.getProfile(user('doctor'), 'C1', 'hospital', '1.1.1.1');
    expect(r).toEqual({ status: 'ok', access: 'full', profile: patient });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MEDICAL_PROFILE_VIEW', resource: 'Customer/C1/hospital' }));
  });

  it('supervisor gets only the redacted profile', async () => {
    const r = await svc.getProfile(user('supervisor'), 'C1', 'hospital');
    expect(r).toEqual({ status: 'ok', access: 'redacted', profile: { kind: 'hospital', redacted: true, hn: 'HN-1001', hasDrugAllergy: true } });
  });

  it('ignores stored data that fails schema validation', async () => {
    store.set('C2:hospital', { kind: 'hospital', hn: 'bad hn!' });
    expect(await svc.getProfile(user('doctor'), 'C2', 'hospital')).toMatchObject({ status: 'ok', profile: null });
  });
});

describe('saveProfile (hospital)', () => {
  it('rejects roles without medical access with 403', async () => {
    const r = await svc.saveProfile(user('SF_2'), 'C1', 'hospital', patient);
    expect(r).toMatchObject({ status: 'error', code: 'FORBIDDEN' });
    expect(store.get('C1:hospital')).toEqual(patient);
  });

  it('nurse may update allergies; audit records field names but not values', async () => {
    const r = await svc.saveProfile(user('nurse'), 'C1', 'hospital', { ...patient, drugAllergies: ['Aspirin'] });
    expect(r.status).toBe('ok');
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MEDICAL_PROFILE_UPDATE', details: 'fields=drugAllergies' }));
    expect(JSON.stringify(audit.mock.calls)).not.toContain('Aspirin');
  });

  it('nurse cannot change chronic conditions', async () => {
    const r = await svc.saveProfile(user('nurse'), 'C1', 'hospital', { ...patient, chronicConditions: [] });
    expect(r).toEqual({ status: 'error', code: 'FORBIDDEN_FIELDS', fields: ['chronicConditions'] });
  });

  it('rejects invalid data and a kind mismatch', async () => {
    expect(await svc.saveProfile(user('doctor'), 'C1', 'hospital', { ...patient, hn: '!' })).toMatchObject({ code: 'INVALID_PROFILE' });
    expect(await svc.saveProfile(user('doctor'), 'C1', 'hospital', { kind: 'auto_service', vehicles: [] })).toMatchObject({ code: 'KIND_MISMATCH' });
  });
});

describe('non-hospital kinds', () => {
  it('any authenticated role can read and write auto service profiles without medical audit', async () => {
    const garage = { kind: 'auto_service', vehicles: [] };
    expect((await svc.saveProfile(user('SF_2'), 'C1', 'auto_service', garage)).status).toBe('ok');
    expect(await svc.getProfile(user('SF_2'), 'C1', 'auto_service')).toEqual({ status: 'ok', access: 'full', profile: garage });
    expect(audit).not.toHaveBeenCalled();
  });
});
