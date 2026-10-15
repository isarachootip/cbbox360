import { describe, it, expect } from 'vitest';
import {
  createLocalIndustryProfileRepository,
  createMemoryStorage,
  INDUSTRY_PROFILES_STORAGE_KEY,
} from './industryProfileRepository';
import { HospitalProfile, IndustryProfile } from '../types/industryProfile';

const patient: HospitalProfile = {
  kind: 'hospital',
  hn: 'HN-1001',
  bloodType: 'B',
  drugAllergies: ['Penicillin'],
  chronicConditions: [],
  insurancePolicies: [],
};

const seed: Record<string, IndustryProfile[]> = { C00123: [patient] };

describe('LocalIndustryProfileRepository', () => {
  it('falls back to seed data when nothing is stored', async () => {
    const repo = createLocalIndustryProfileRepository(createMemoryStorage(), seed);
    expect(await repo.get('C00123', 'hospital')).toEqual(patient);
    expect(await repo.get('C00123', 'auto_service')).toBeNull();
    expect(await repo.get('UNKNOWN', 'hospital')).toBeNull();
  });

  it('saves a valid profile and reads it back (stored value overrides seed)', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalIndustryProfileRepository(storage, seed);
    const updated = { ...patient, drugAllergies: [] };
    const result = await repo.save('C00123', updated);
    expect(result.ok).toBe(true);
    expect(await repo.get('C00123', 'hospital')).toEqual(updated);
  });

  it('keeps profiles of different industries for the same customer separately', async () => {
    const repo = createLocalIndustryProfileRepository(createMemoryStorage());
    await repo.save('C1', patient);
    await repo.save('C1', { kind: 'auto_service', vehicles: [] });
    expect((await repo.get('C1', 'hospital'))?.kind).toBe('hospital');
    expect((await repo.get('C1', 'auto_service'))?.kind).toBe('auto_service');
  });

  it('rejects invalid data with field errors and does not write', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalIndustryProfileRepository(storage);
    const result = await repo.save('C1', { ...patient, hn: 'bad hn!' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].path).toBe('hn');
    expect(storage.getItem(INDUSTRY_PROFILES_STORAGE_KEY)).toBeNull();
  });

  it('ignores corrupted or tampered stored data', async () => {
    const storage = createMemoryStorage();
    storage.setItem(INDUSTRY_PROFILES_STORAGE_KEY, '{not json');
    const repo = createLocalIndustryProfileRepository(storage, seed);
    expect(await repo.get('C00123', 'hospital')).toEqual(patient);

    storage.setItem(INDUSTRY_PROFILES_STORAGE_KEY, JSON.stringify({ 'C9:hospital': { kind: 'hospital' } }));
    expect(await repo.get('C9', 'hospital')).toBeNull();
  });
});
