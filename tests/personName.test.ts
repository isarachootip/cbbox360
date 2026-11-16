import { describe, it, expect } from 'vitest';
import {
  formatPersonFullName,
  parseLegacyPersonName,
  computeCustomerInitials,
  personNameSchema,
} from '../src/domain/customer/personName';
import {
  applyCustomerUpdate,
  buildNewCustomerRecord,
} from '../src/domain/customer/customerMutations';
import type { Customer } from '../src/types';

describe('Person Name Domain Logic', () => {
  it('formats Thai prefix, firstName, and lastName without extra space after Thai prefix', () => {
    expect(
      formatPersonFullName({ prefix: 'คุณ', firstName: 'สมชาย', lastName: 'ใจดี' })
    ).toBe('คุณสมชาย ใจดี');

    expect(
      formatPersonFullName({ prefix: 'นพ.', firstName: 'กิตติ', lastName: 'ณ อยุธยา' })
    ).toBe('นพ.กิตติ ณ อยุธยา');
  });

  it('handles optional lastName and trims extra whitespace cleanly', () => {
    expect(
      formatPersonFullName({ prefix: 'คุณ', firstName: '  บอย ', lastName: '   ' })
    ).toBe('คุณบอย');

    expect(
      formatPersonFullName({ firstName: 'สมชาย', lastName: 'ใจดี' })
    ).toBe('สมชาย ใจดี');
  });

  it('parses legacy single-string Thai names including longest-prefix matching (นางสาว vs นาง)', () => {
    expect(parseLegacyPersonName('คุณกิตติศักดิ์ พงษ์ศิริ')).toEqual({
      prefix: 'คุณ',
      firstName: 'กิตติศักดิ์',
      lastName: 'พงษ์ศิริ',
    });

    expect(parseLegacyPersonName('นางสาวกนกวรรณ พ.')).toEqual({
      prefix: 'นางสาว',
      firstName: 'กนกวรรณ',
      lastName: 'พ.',
    });

    expect(parseLegacyPersonName('สมชาย ณ อยุธยา')).toEqual({
      prefix: '',
      firstName: 'สมชาย',
      lastName: 'ณ อยุธยา',
    });

    expect(parseLegacyPersonName('ช่างวิรัช')).toEqual({
      prefix: 'ช่าง',
      firstName: 'วิรัช',
      lastName: '',
    });
  });

  it('computes clean avatar initials skipping Thai leading vowels and corporate prefixes', () => {
    expect(
      computeCustomerInitials({
        customerType: 'INDIVIDUAL',
        prefix: 'คุณ',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
      })
    ).toBe('สจ');

    expect(
      computeCustomerInitials({
        customerType: 'INDIVIDUAL',
        firstName: 'เอกชัย',
        lastName: 'แสนดี',
      })
    ).toBe('อส');

    expect(
      computeCustomerInitials({
        customerType: 'INDIVIDUAL',
        firstName: 'Pim',
        lastName: 'Chanida',
      })
    ).toBe('PC');

    expect(
      computeCustomerInitials({
        customerType: 'CORPORATE',
        companyName: 'บริษัท นำชัยการพิมพ์ จำกัด',
      })
    ).toBe('นช');
  });

  it('validates firstName as required while keeping lastName, prefix, and nickname optional', () => {
    expect(personNameSchema.safeParse({ firstName: '   ' }).success).toBe(false);
    const valid = personNameSchema.safeParse({
      prefix: 'คุณ',
      firstName: 'สมชาย',
      lastName: '',
      nickname: 'ชาย',
    });
    expect(valid.success).toBe(true);
  });

  it('updates structured name, recomputes full name & initials, and syncs self primary contact', () => {
    const baseCustomer = buildNewCustomerRecord('C00123', {
      name: 'สมชาย ใจดี',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '081-892-5678',
      email: 'somchai@example.com',
      tier: 'PLATINUM',
      creditGrade: 'A',
      customerType: 'INDIVIDUAL',
      contacts: [
        {
          id: 'cnt-self',
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          name: 'สมชาย ใจดี',
          roleOrTitle: 'เจ้าของ',
          phone: '081-892-5678',
          isPrimary: true,
        },
      ],
    });

    const updated: Customer = applyCustomerUpdate(baseCustomer, {
      prefix: 'นพ.',
      firstName: 'เอกชัย',
      lastName: 'แสนดี',
      nickname: 'หมอเอก',
    });

    expect(updated.name).toBe('นพ.เอกชัย แสนดี');
    expect(updated.initials).toBe('อส');
    expect(updated.nickname).toBe('หมอเอก');
    expect(updated.contacts?.[0].name).toBe('นพ.เอกชัย แสนดี');
    expect(updated.contacts?.[0].nickname).toBe('หมอเอก');
  });

  it('builds new individual customer with optional lastName cleanly', () => {
    const created = buildNewCustomerRecord('C00999', {
      name: '',
      prefix: 'คุณ',
      firstName: 'บอย',
      lastName: '',
      nickname: 'บอย',
      phone: '089-000-1111',
      email: '',
      tier: 'MEMBER',
      creditGrade: 'B',
      customerType: 'INDIVIDUAL',
    });

    expect(created.name).toBe('คุณบอย');
    expect(created.firstName).toBe('บอย');
    expect(created.lastName).toBeUndefined();
    expect(created.initials).toBe('บอ');
  });
});
