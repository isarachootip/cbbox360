import { describe, it, expect } from 'vitest';
import { parseGoogleAddressComponents } from '../src/utils/googleMaps';
import {
  setPrimaryContact,
  setDefaultAddress,
  formatFullAddress,
  validateTaxId,
} from '../src/utils/customerHelpers';
import { ContactPerson, CustomerAddress } from '../src/types';

describe('Google Maps Address Components Parser', () => {
  it('correctly extracts subdistrict, district, province, and postal code from Google Places components', () => {
    const mockComponents = [
      { long_name: '123/45', types: ['street_number'] },
      { long_name: 'ถนนสาทรใต้', types: ['route'] },
      { long_name: 'ทุ่งมหาเมฆ', types: ['sublocality_level_2', 'sublocality'] },
      { long_name: 'สาทร', types: ['sublocality_level_1', 'locality'] },
      { long_name: 'กรุงเทพมหานคร', types: ['administrative_area_level_1'] },
      { long_name: '10120', types: ['postal_code'] },
    ];

    const result = parseGoogleAddressComponents(mockComponents);

    expect(result.subdistrict).toBe('ทุ่งมหาเมฆ');
    expect(result.district).toBe('สาทร');
    expect(result.province).toBe('กรุงเทพมหานคร');
    expect(result.postalCode).toBe('10120');
  });

  it('handles empty or malformed components gracefully without crashing', () => {
    const result = parseGoogleAddressComponents([]);
    expect(result.subdistrict).toBe('');
    expect(result.district).toBe('');
    expect(result.province).toBe('');
    expect(result.postalCode).toBe('');
  });
});

describe('Corporate Customer Domain Helpers', () => {
  const sampleContacts: ContactPerson[] = [
    {
      id: 'c1',
      name: 'กิตติศักดิ์',
      roleOrTitle: 'จัดซื้อ',
      phone: '0811111111',
      isPrimary: true,
    },
    {
      id: 'c2',
      name: 'กรรณิการ์',
      roleOrTitle: 'บัญชี',
      phone: '0822222222',
      isPrimary: false,
    },
  ];

  it('setPrimaryContact sets target contact as primary and demotes other contacts', () => {
    const updated = setPrimaryContact(sampleContacts, 'c2');
    const c1 = updated.find((c) => c.id === 'c1');
    const c2 = updated.find((c) => c.id === 'c2');

    expect(c2?.isPrimary).toBe(true);
    expect(c1?.isPrimary).toBe(false);
  });

  const sampleAddresses: CustomerAddress[] = [
    {
      id: 'a1',
      type: 'BILLING',
      title: 'สำนักงานใหญ่',
      addressLine1: '123 สาทร',
      subdistrict: 'ทุ่งมหาเมฆ',
      district: 'สาทร',
      province: 'กทม.',
      postalCode: '10120',
      isDefaultBilling: true,
      isDefaultShipping: false,
    },
    {
      id: 'a2',
      type: 'SHIPPING',
      title: 'คลังสินค้าบางพลี',
      addressLine1: '99/1 บางพลี',
      subdistrict: 'บางปลา',
      district: 'บางพลี',
      province: 'สมุทรปราการ',
      postalCode: '10540',
      isDefaultBilling: false,
      isDefaultShipping: true,
    },
  ];

  it('setDefaultAddress updates default shipping exclusively', () => {
    const updated = setDefaultAddress(sampleAddresses, 'a1', 'shipping');
    const a1 = updated.find((a) => a.id === 'a1');
    const a2 = updated.find((a) => a.id === 'a2');

    expect(a1?.isDefaultShipping).toBe(true);
    expect(a2?.isDefaultShipping).toBe(false);
    // Billing should remain unchanged
    expect(a1?.isDefaultBilling).toBe(true);
    expect(a2?.isDefaultBilling).toBe(false);
  });

  it('setDefaultAddress updates default billing exclusively', () => {
    const updated = setDefaultAddress(sampleAddresses, 'a2', 'billing');
    const a1 = updated.find((a) => a.id === 'a1');
    const a2 = updated.find((a) => a.id === 'a2');

    expect(a2?.isDefaultBilling).toBe(true);
    expect(a1?.isDefaultBilling).toBe(false);
  });

  it('formatFullAddress formats address with subdistrict, district, province, postalCode', () => {
    const formatted = formatFullAddress(sampleAddresses[0]);
    expect(formatted).toBe('123 สาทร ต./แขวง ทุ่งมหาเมฆ อ./เขต สาทร กทม. 10120');
  });

  it('validateTaxId validates 13-digit Thai corporate tax identification numbers', () => {
    expect(validateTaxId('0105558091234')).toBe(true);
    expect(validateTaxId('123')).toBe(false);
    expect(validateTaxId('010555809123A')).toBe(false);
    expect(validateTaxId('')).toBe(false);
  });
});
