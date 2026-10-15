import { describe, it, expect } from 'vitest';
import {
  getMedicalAccess,
  redactHospitalProfile,
  findForbiddenNurseChanges,
  changedHospitalFields,
} from './medicalAccessPolicy.js';

const patient = {
  kind: 'hospital',
  hn: 'HN-1001',
  bloodType: 'O',
  drugAllergies: ['Penicillin'],
  chronicConditions: ['เบาหวาน'],
  insurancePolicies: [],
  preferredDoctor: 'นพ. ก',
};

describe('getMedicalAccess', () => {
  it.each([
    ['admin', 'full'],
    ['doctor', 'full'],
    ['nurse', 'nurse'],
    ['sysadmin', 'redacted'],
    ['supervisor', 'redacted'],
    ['SF_1', 'redacted'],
    ['SF_2', 'redacted'],
    ['SF_3', 'redacted'],
    ['unknown-role', 'redacted'],
  ])('%s → %s', (role, expected) => {
    expect(getMedicalAccess(role)).toBe(expected);
  });
});

describe('redactHospitalProfile', () => {
  it('keeps only HN and an allergy flag (no allergy names, conditions or insurance)', () => {
    expect(redactHospitalProfile(patient)).toEqual({ kind: 'hospital', redacted: true, hn: 'HN-1001', hasDrugAllergy: true });
  });
});

describe('findForbiddenNurseChanges', () => {
  it('allows nurse edits to allergies, emergency contact and insurance', () => {
    const after = {
      ...patient,
      drugAllergies: ['Penicillin', 'Aspirin'],
      emergencyContact: { name: 'ก', phone: '0812345678', relation: 'บุตร' },
      insurancePolicies: [{ id: 'p', provider: 'AIA', policyNo: '1', coverageType: 'OPD' }],
    };
    expect(findForbiddenNurseChanges(patient, after)).toEqual([]);
  });

  it('rejects nurse edits to HN, blood type, chronic conditions or doctor', () => {
    const after = { ...patient, hn: 'HN-9999', chronicConditions: [], preferredDoctor: 'นพ. ข', bloodType: 'A' };
    expect(findForbiddenNurseChanges(patient, after).sort()).toEqual(['bloodType', 'chronicConditions', 'hn', 'preferredDoctor']);
  });

  it('a nurse cannot create a new patient profile (identity fields would be set)', () => {
    expect(findForbiddenNurseChanges(null, patient)).toContain('hn');
  });
});

describe('changedHospitalFields', () => {
  it('lists changed field names only (for audit, without values)', () => {
    expect(changedHospitalFields(patient, { ...patient, drugAllergies: [] })).toEqual(['drugAllergies']);
  });
});
