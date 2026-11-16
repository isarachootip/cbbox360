import { describe, it, expect } from 'vitest';
import {
  computeNextCustomerId,
  validateAndBuildCreateCustomer,
  validateEditCustomerInput,
} from '../src/domain/customer/customerValidation';
import {
  customerRecordSchema,
  loadStoredCustomers,
  mergeRemoteCustomers,
  saveStoredCustomers,
} from '../src/domain/customer/customerStorage';
// @ts-expect-error JS server module imported for cross-layer schema parity verification
import { serverCustomerSchema } from '../server/controllers/customerController.js';
import { createMemoryStorage } from '../src/services/industryProfileRepository';
import { buildNewCustomerRecord } from '../src/domain/customer/customerMutations';
import { mockCustomers } from '../src/data/customers';

describe('Customer Validation & ID Generation', () => {
  it('computes sequential collision-free customer IDs starting after C00137', () => {
    expect(computeNextCustomerId(mockCustomers)).toBe('C00138');
    expect(computeNextCustomerId([{ id: 'C00142' }, { id: 'C00123' }])).toBe('C00143');
    expect(computeNextCustomerId([])).toBe('C00123');
  });

  it('builds a valid B2C customer payload and trims whitespace', () => {
    const res = validateAndBuildCreateCustomer({
      customerType: 'INDIVIDUAL',
      personDraft: {
        prefix: 'คุณ',
        firstName: '  กิตติพงศ์ ',
        lastName: ' วงศ์สว่าง ',
        nickname: ' กิต ',
      },
      corpDraft: { companyName: '', taxId: '', branchCode: '00000' },
      contactDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      contactRole: '',
      phone: ' 089-123-4567 ',
      email: ' kitti@example.com ',
      tier: 'GOLD',
      creditGrade: 'A',
      creditLimit: '120000',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.payload.name).toBe('คุณกิตติพงศ์ วงศ์สว่าง');
    expect(res.payload.firstName).toBe('กิตติพงศ์');
    expect(res.payload.nickname).toBe('กิต');
    expect(res.payload.phone).toBe('089-123-4567');
    expect(res.payload.email).toBe('kitti@example.com');
    expect(res.payload.creditLimit).toBe(120000);
    expect(res.payload.contacts).toHaveLength(1);
  });

  it('returns field-level errors when B2C required fields or email are invalid', () => {
    const res = validateAndBuildCreateCustomer({
      customerType: 'INDIVIDUAL',
      personDraft: { prefix: '', firstName: '   ', lastName: '', nickname: '' },
      corpDraft: { companyName: '', taxId: '', branchCode: '00000' },
      contactDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      contactRole: '',
      phone: '',
      email: 'invalid-email',
      tier: 'MEMBER',
      creditGrade: 'B',
      creditLimit: '-500',
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errors.firstName).toBeTruthy();
    expect(res.errors.phone).toBeTruthy();
    expect(res.errors.email).toBeTruthy();
    expect(res.errors.creditLimit).toBeTruthy();
  });

  it('validates B2B companyName and 13-digit taxId when provided', () => {
    const badCorp = validateAndBuildCreateCustomer({
      customerType: 'CORPORATE',
      personDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      corpDraft: { companyName: '', taxId: '12345', branchCode: '00000' },
      contactDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      contactRole: 'ฝ่ายจัดซื้อ',
      phone: '02-555-9999',
      email: '',
      tier: 'SILVER',
      creditGrade: 'B',
      creditLimit: '80000',
    });

    expect(badCorp.ok).toBe(false);
    if (!badCorp.ok) {
      expect(badCorp.errors.companyName).toBeTruthy();
      expect(badCorp.errors.taxId).toBeTruthy();
    }

    const goodCorp = validateAndBuildCreateCustomer({
      customerType: 'CORPORATE',
      personDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      corpDraft: {
        companyName: 'บริษัท สยามพริ้นติ้ง จำกัด',
        taxId: '0105560012345',
        branchCode: '00000',
      },
      contactDraft: { prefix: 'คุณ', firstName: 'วรพล', lastName: 'ดีงาม', nickname: 'พล' },
      contactRole: 'ผู้จัดการจัดซื้อ',
      phone: '02-555-9999',
      email: 'purchase@siamprint.co.th',
      tier: 'GOLD',
      creditGrade: 'A',
      creditLimit: '250000',
    });

    expect(goodCorp.ok).toBe(true);
    if (goodCorp.ok) {
      expect(goodCorp.payload.companyName).toBe('บริษัท สยามพริ้นติ้ง จำกัด');
      expect(goodCorp.payload.taxId).toBe('0105560012345');
      expect(goodCorp.payload.contacts?.[0]?.name).toBe('คุณวรพล ดีงาม');
    }
  });

  it('validates EditCustomerInput and rejects missing phone or name', () => {
    const invalid = validateEditCustomerInput({
      customerType: 'INDIVIDUAL',
      personDraft: { prefix: '', firstName: '', lastName: '', nickname: '' },
      corpDraft: { companyName: '', taxId: '', branchCode: '' },
      phone: '',
      email: 'bad@',
      birthday: '',
    });
    expect(invalid.ok).toBe(false);
  });
});

describe('Customer Storage Persistence & Remote Merge', () => {
  it('saves newly created and edited customers to storage and reloads them intact', () => {
    const storage = createMemoryStorage();
    const created = buildNewCustomerRecord('C00138', {
      name: 'คุณอรอนงค์ รักษ์ดี',
      prefix: 'คุณ',
      firstName: 'อรอนงค์',
      lastName: 'รักษ์ดี',
      customerType: 'INDIVIDUAL',
      phone: '081-999-1122',
      email: 'orn@example.com',
      tier: 'SILVER',
      creditGrade: 'B',
      creditLimit: 75000,
    });

    const editedSeed = { ...mockCustomers[0], name: 'สมชาย ใจดี (อัปเดต)', email: 'new@example.com' };
    const currentList = [created, editedSeed, ...mockCustomers.slice(1)];
    saveStoredCustomers(storage, currentList);

    const reloaded = loadStoredCustomers(storage, mockCustomers);
    expect(reloaded[0].id).toBe('C00138');
    expect(reloaded[0].name).toBe('คุณอรอนงค์ รักษ์ดี');
    expect(reloaded.find((c) => c.id === mockCustomers[0].id)?.email).toBe('new@example.com');
    expect(reloaded).toHaveLength(mockCustomers.length + 1);
  });

  it('falls back safely to seed customers when storage data is corrupted', () => {
    const storage = createMemoryStorage();
    storage.setItem('cb360_customers_data', '{corrupted-json');
    const loaded = loadStoredCustomers(storage, mockCustomers);
    expect(loaded).toHaveLength(mockCustomers.length);
  });

  it('merges remote server customers while preserving seed records', () => {
    const remoteCustomer = buildNewCustomerRecord('C00139', {
      name: 'บริษัท ไทยแพ็คเกจจิ้ง จำกัด',
      companyName: 'บริษัท ไทยแพ็คเกจจิ้ง จำกัด',
      customerType: 'CORPORATE',
      phone: '02-888-7777',
      email: 'info@thaipack.co.th',
      tier: 'PLATINUM',
      creditGrade: 'A',
      creditLimit: 500000,
    });
    const merged = mergeRemoteCustomers(mockCustomers, [remoteCustomer], mockCustomers);
    expect(merged.some((c) => c.id === 'C00139')).toBe(true);
    expect(merged).toHaveLength(mockCustomers.length + 1);
  });

  it('guarantees 100% schema parity between all mock/created customers and serverCustomerSchema', () => {
    for (const c of mockCustomers) {
      const jsonRoundTrip: unknown = JSON.parse(JSON.stringify(c));
      expect(customerRecordSchema.safeParse(jsonRoundTrip).success).toBe(true);
      expect(serverCustomerSchema.safeParse(jsonRoundTrip).success).toBe(true);
    }

    const newCorp = buildNewCustomerRecord('C00140', {
      name: 'บจก. ทดสอบซิงก์เซิร์ฟเวอร์',
      companyName: 'บจก. ทดสอบซิงก์เซิร์ฟเวอร์',
      customerType: 'CORPORATE',
      phone: '02-123-4567',
      email: '',
      tier: 'MEMBER',
      creditGrade: 'B',
      creditLimit: 50000,
    });
    const roundTripNew: unknown = JSON.parse(JSON.stringify(newCorp));
    expect(customerRecordSchema.safeParse(roundTripNew).success).toBe(true);
    expect(serverCustomerSchema.safeParse(roundTripNew).success).toBe(true);
  });
});
