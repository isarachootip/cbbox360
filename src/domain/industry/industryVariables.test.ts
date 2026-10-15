import { describe, it, expect } from 'vitest';
import { buildIndustryVariables, templateToIndustryKind } from './industryVariables';
import { hospitalProfileSchema, vehicleSchema, logisticsProfileSchema } from './schemas';
import { AutoServiceProfile } from '../../types/industryProfile';

describe('templateToIndustryKind', () => {
  it('maps industry templates and returns null for B2B', () => {
    expect(templateToIndustryKind('hospital')).toBe('hospital');
    expect(templateToIndustryKind('auto_service')).toBe('auto_service');
    expect(templateToIndustryKind('logistics')).toBe('logistics');
    expect(templateToIndustryKind('b2b_wholesale')).toBeNull();
  });
});

describe('buildIndustryVariables', () => {
  it('returns no variables without a profile', () => {
    expect(buildIndustryVariables(null)).toEqual({});
  });

  it('maps hospital fields and omits empty ones', () => {
    const vars = buildIndustryVariables({
      kind: 'hospital',
      hn: 'HN-1001',
      bloodType: 'A',
      drugAllergies: [],
      chronicConditions: [],
      insurancePolicies: [],
    });
    expect(vars).toEqual({ hn_number: 'HN-1001' });
  });

  const garage: AutoServiceProfile = {
    kind: 'auto_service',
    vehicles: [
      { id: 'v1', licensePlate: '1กข-9988', province: 'กรุงเทพมหานคร', brand: 'Toyota', model: 'Yaris', currentMileageKm: 80000 },
      { id: 'v2', licensePlate: '2ขค-1234', province: 'นนทบุรี', brand: 'Honda', model: 'City', currentMileageKm: 12345 },
    ],
  };

  it('uses the first vehicle by default', () => {
    expect(buildIndustryVariables(garage)).toEqual({
      license_plate: '1กข-9988 กรุงเทพมหานคร',
      mileage_km: '80,000 กม.',
    });
  });

  it('uses the selected vehicle when given', () => {
    expect(buildIndustryVariables(garage, { vehicleId: 'v2' }).mileage_km).toBe('12,345 กม.');
  });

  it('uses the latest tracking number for logistics', () => {
    const vars = buildIndustryVariables({
      kind: 'logistics',
      accountCode: 'ACC-1',
      originBranch: 'บางนา',
      defaultService: 'express',
      codEnabled: false,
      recentTrackingNumbers: ['TH-NEW', 'TH-OLD'],
    });
    expect(vars).toEqual({ tracking_no: 'TH-NEW' });
  });
});

describe('schemas (boundary validation)', () => {
  it('rejects a VIN containing I/O/Q and normalises case', () => {
    const base = { id: 'v', licensePlate: 'กก-1', province: 'กทม', brand: 'B', model: 'M', currentMileageKm: 1 };
    expect(vehicleSchema.safeParse({ ...base, vin: 'JTDKB20U0O3000001' }).success).toBe(false);
    const ok = vehicleSchema.safeParse({ ...base, vin: 'jtdkb20u093000001' });
    expect(ok.success && ok.data.vin).toBe('JTDKB20U093000001');
  });

  it('rejects last-service mileage above current mileage', () => {
    const result = vehicleSchema.safeParse({
      id: 'v', licensePlate: 'กก-1', province: 'กทม', brand: 'B', model: 'M',
      currentMileageKm: 1000, lastServiceMileageKm: 2000,
    });
    expect(result.success).toBe(false);
  });

  it('requires a bank account when COD is enabled', () => {
    const result = logisticsProfileSchema.safeParse({
      kind: 'logistics', accountCode: 'A', originBranch: 'B', defaultService: 'standard',
      codEnabled: true, recentTrackingNumbers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an HN with invalid characters', () => {
    const result = hospitalProfileSchema.safeParse({
      kind: 'hospital', hn: 'HN 12/3', bloodType: 'O',
      drugAllergies: [], chronicConditions: [], insurancePolicies: [],
    });
    expect(result.success).toBe(false);
  });
});
