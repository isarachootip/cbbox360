import { describe, it, expect } from 'vitest';
import { matchesCustomerSearch } from '../src/domain/customer/customerSearch';
import { buildNewCustomerRecord } from '../src/domain/customer/customerMutations';
import type { Customer } from '../src/types';

describe('Tokenized Single-Box Customer Search', () => {
  const individualCustomer: Customer = {
    ...buildNewCustomerRecord('C00123', {
      name: 'สมชาย ใจดี',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      nickname: 'เฮียชาย',
      phone: '081-xxx-5678',
      email: 'somchai@example.com',
      tier: 'PLATINUM',
      creditGrade: 'A',
      customerType: 'INDIVIDUAL',
    }),
    fullPhone: '081-892-5678',
  };

  const corporateCustomer: Customer = {
    ...buildNewCustomerRecord('C00124', {
      name: 'บจก. นำชัยการพิมพ์',
      companyName: 'บริษัท นำชัยการพิมพ์ จำกัด',
      taxId: '0105558091234',
      phone: '082-xxx-1122',
      email: 'namchai@example.com',
      tier: 'GOLD',
      creditGrade: 'A',
      customerType: 'CORPORATE',
      contacts: [
        {
          id: 'cnt-101',
          prefix: 'คุณ',
          firstName: 'กิตติศักดิ์',
          lastName: 'พงษ์ศิริ',
          nickname: 'กิต',
          name: 'คุณกิตติศักดิ์ พงษ์ศิริ',
          roleOrTitle: 'ผู้จัดการฝ่ายจัดซื้อ',
          phone: '082-345-1122',
          isPrimary: true,
        },
      ],
    }),
    fullPhone: '082-345-1122',
  };

  it('matches firstName, lastName, and multi-token "ชื่อ เว้นวรรค นามสกุล" queries', () => {
    expect(matchesCustomerSearch(individualCustomer, 'สมชาย')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, 'ใจดี')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, 'สมชาย ใจ')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, '  สมชาย    ใจดี ')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, 'ใจดี สมชาย')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, 'สมชาย พงษ์')).toBe(false);
  });

  it('matches by nickname and unmasked phone digits', () => {
    expect(matchesCustomerSearch(individualCustomer, 'เฮียชาย')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, '0818925678')).toBe(true);
    expect(matchesCustomerSearch(individualCustomer, '892-5678')).toBe(true);
  });

  it('matches B2B corporate customers via contact person firstName + lastName or nickname', () => {
    expect(matchesCustomerSearch(corporateCustomer, 'กิตติศักดิ์ พงษ์')).toBe(true);
    expect(matchesCustomerSearch(corporateCustomer, 'กิต นำชัย')).toBe(true);
  });
});
