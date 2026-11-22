import { describe, it, expect } from 'vitest';
import { redactCustomFields } from '../fieldRedactor.js';

const CONTRACT_STATUS_DEF = [
  {
    id: 'fd-contract-status',
    entityType: 'contact',
    key: 'contract_status',
    label: 'สถานะสัญญาบริการ',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'อยู่ในสัญญา (Active)' },
      { value: 'EXPIRING', label: 'ใกล้หมดสัญญา' },
      { value: 'EXPIRED', label: 'หมดสัญญาแล้ว (Out-of-MA)' },
    ],
    ui: {
      group: 'สัญญาบริการ',
      order: 1,
      alertBanner: {
        whenEquals: ['EXPIRED', 'EXPIRING'],
        severity: 'warning',
        prefix: 'แจ้งเตือนสัญญา:',
      },
    },
  },
];

describe('fieldRedactor declarative alertBanner.whenEquals', () => {
  it('does NOT emit banner when value does not match whenEquals', async () => {
    const res = await redactCustomFields({
      defs: CONTRACT_STATUS_DEF,
      values: { contract_status: 'ACTIVE' },
      grantedPermissions: ['contact:read'],
    });
    expect(res.banners).toEqual([]);
  });

  it('emits banner with option label when value matches whenEquals', async () => {
    const res = await redactCustomFields({
      defs: CONTRACT_STATUS_DEF,
      values: { contract_status: 'EXPIRED' },
      grantedPermissions: ['contact:read'],
    });
    expect(res.banners).toHaveLength(1);
    expect(res.banners[0]).toMatchObject({
      fieldKey: 'contract_status',
      severity: 'warning',
      prefix: 'แจ้งเตือนสัญญา:',
      text: 'หมดสัญญาแล้ว (Out-of-MA)',
      redacted: false,
    });
  });
});
