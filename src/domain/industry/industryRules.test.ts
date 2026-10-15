import { describe, it, expect } from 'vitest';
import { getExpiryStatus } from './dateRules';
import {
  validateMileageUpdate,
  getNextServiceMileage,
  getServiceStatus,
  DEFAULT_SERVICE_INTERVAL_KM,
} from './vehicleRules';
import { hasDrugAllergy, getPolicyStatus } from './hospitalRules';
import { Vehicle, HospitalProfile } from '../../types/industryProfile';

const today = new Date(2026, 9, 15); // 15 Oct 2026 (local)

const baseVehicle: Vehicle = {
  id: 'v1',
  licensePlate: '1กข-9988',
  province: 'กรุงเทพมหานคร',
  brand: 'Toyota',
  model: 'Corolla Cross',
  currentMileageKm: 80_000,
};

describe('getExpiryStatus', () => {
  it('is unknown when no date is set', () => {
    expect(getExpiryStatus(undefined, today)).toBe('unknown');
  });
  it('is expired the day after the expiry date', () => {
    expect(getExpiryStatus('2026-10-14', today)).toBe('expired');
  });
  it('is expiring_soon on the expiry date itself and within 60 days', () => {
    expect(getExpiryStatus('2026-10-15', today)).toBe('expiring_soon');
    expect(getExpiryStatus('2026-12-14', today)).toBe('expiring_soon');
  });
  it('is valid beyond the warning window', () => {
    expect(getExpiryStatus('2026-12-15', today)).toBe('valid');
  });
  it('supports a custom warning window', () => {
    expect(getExpiryStatus('2026-10-25', today, 7)).toBe('valid');
  });
});

describe('validateMileageUpdate', () => {
  it('accepts equal or higher mileage', () => {
    expect(validateMileageUpdate(80_000, 80_000)).toEqual({ ok: true });
    expect(validateMileageUpdate(80_000, 85_250)).toEqual({ ok: true });
  });
  it('rejects mileage lower than the previous reading (odometer rollback)', () => {
    const result = validateMileageUpdate(80_000, 79_999);
    expect(result.ok).toBe(false);
  });
  it('rejects negative or fractional mileage', () => {
    expect(validateMileageUpdate(0, -1).ok).toBe(false);
    expect(validateMileageUpdate(0, 100.5).ok).toBe(false);
  });
});

describe('service schedule', () => {
  it('has no next service when last service mileage is unknown', () => {
    expect(getNextServiceMileage(baseVehicle)).toBeNull();
    expect(getServiceStatus(baseVehicle)).toBe('unknown');
  });
  it('uses the default 10,000 km interval', () => {
    const v = { ...baseVehicle, lastServiceMileageKm: 75_000 };
    expect(getNextServiceMileage(v)).toBe(75_000 + DEFAULT_SERVICE_INTERVAL_KM);
    expect(getServiceStatus(v)).toBe('ok');
  });
  it('honours a custom interval', () => {
    const v = { ...baseVehicle, lastServiceMileageKm: 75_000, serviceIntervalKm: 5_000 };
    expect(getNextServiceMileage(v)).toBe(80_000);
    expect(getServiceStatus(v)).toBe('overdue');
  });
  it('is due_soon within 1,000 km of the next service', () => {
    const v = { ...baseVehicle, lastServiceMileageKm: 71_000 };
    expect(getServiceStatus(v)).toBe('due_soon');
  });
});

describe('hospital rules', () => {
  const patient: HospitalProfile = {
    kind: 'hospital',
    hn: 'HN-6904812',
    bloodType: 'O',
    drugAllergies: [],
    chronicConditions: [],
    insurancePolicies: [],
  };

  it('flags drug allergies', () => {
    expect(hasDrugAllergy(patient)).toBe(false);
    expect(hasDrugAllergy({ ...patient, drugAllergies: ['Penicillin'] })).toBe(true);
  });

  it('reports policy expiry status', () => {
    const policy = { id: 'p1', provider: 'AIA', policyNo: 'X1', coverageType: 'OPD_IPD' as const };
    expect(getPolicyStatus({ ...policy, validUntil: '2026-01-01' }, today)).toBe('expired');
    expect(getPolicyStatus(policy, today)).toBe('unknown');
  });
});
