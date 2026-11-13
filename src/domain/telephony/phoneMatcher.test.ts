import { describe, it, expect } from 'vitest';
import { mockCustomers } from '../../data/customers';
import {
  normalizeThaiPhone,
  formatThaiPhoneDisplay,
  matchCustomersByPhone,
  buildScreenPopUrlTemplate,
} from './phoneMatcher';
import { parseScreenPopQuery, sanitizeReturnTo } from './screenPopSchema';
import { buildCallTimelineEvent } from './callLogHelpers';

describe('phoneMatcher domain logic', () => {
  it('normalizes standard Thai mobile and landline formats', () => {
    expect(normalizeThaiPhone('081-892-5678')).toBe('0818925678');
    expect(normalizeThaiPhone('02-890-1234')).toBe('028901234');
    expect(normalizeThaiPhone('(082) 345 1122')).toBe('0823451122');
  });

  it('normalizes +66, space-decoded 66, 0066, and PBX trunk prefix 9', () => {
    expect(normalizeThaiPhone('+66823451122')).toBe('0823451122');
    expect(normalizeThaiPhone(' 66823451122')).toBe('0823451122');
    expect(normalizeThaiPhone('66823451122')).toBe('0823451122');
    expect(normalizeThaiPhone('0066823451122')).toBe('0823451122');
    expect(normalizeThaiPhone('+6628901234')).toBe('028901234');
    expect(normalizeThaiPhone('90823451122')).toBe('0823451122');
    expect(normalizeThaiPhone('9028901234')).toBe('028901234');
  });

  it('strips internal extension suffixes and ignores masked phone strings', () => {
    expect(normalizeThaiPhone('02-890-1234 ต่อ 102')).toBe('028901234');
    expect(normalizeThaiPhone('02-890-1234 ext. 102')).toBe('028901234');
    expect(normalizeThaiPhone('02-890-1234 #102')).toBe('028901234');
    expect(normalizeThaiPhone('081-xxx-5678')).toBe('');
    expect(normalizeThaiPhone('%CallerNumber%')).toBe('');
  });

  it('formats normalized Thai numbers cleanly for UI display', () => {
    expect(formatThaiPhoneDisplay('0823451122')).toBe('082-345-1122');
    expect(formatThaiPhoneDisplay('028901234')).toBe('02-890-1234');
    expect(formatThaiPhoneDisplay('1150')).toBe('1150');
  });

  it('matches individual customer once without duplicating across contacts/addresses', () => {
    const matches = matchCustomersByPhone(mockCustomers, '0818925678');
    expect(matches).toHaveLength(1);
    expect(matches[0].customer.id).toBe('C00123');
    expect(matches[0].matchedField).toBe('primary');
  });

  it('matches corporate B2B primary and secondary contact phones (+66 format) with contact labels', () => {
    const primaryMatches = matchCustomersByPhone(mockCustomers, '+66823451122');
    expect(primaryMatches).toHaveLength(1);
    expect(primaryMatches[0].customer.id).toBe('C00124');
    expect(primaryMatches[0].matchedField).toBe('primary');
    expect(primaryMatches[0].matchedLabel).toContain('คุณกิตติศักดิ์');

    const secondaryMatches = matchCustomersByPhone(mockCustomers, '+66897714567');
    expect(secondaryMatches).toHaveLength(1);
    expect(secondaryMatches[0].customer.id).toBe('C00124');
    expect(secondaryMatches[0].matchedField).toBe('contact');
    expect(secondaryMatches[0].matchedLabel).toContain('ช่างวิรัช');
  });

  it('returns multiple matches when two customers share the same contact number', () => {
    const sharedCustomers = [
      mockCustomers[0],
      {
        ...mockCustomers[1],
        id: 'C99999',
        name: 'สาขาที่ 2',
        fullPhone: '081-892-5678',
      },
    ];
    const matches = matchCustomersByPhone(sharedCustomers, '0818925678');
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.customer.id)).toEqual(['C00123', 'C99999']);
  });

  it('returns empty array for unknown caller or empty query', () => {
    expect(matchCustomersByPhone(mockCustomers, '0899998888')).toEqual([]);
    expect(matchCustomersByPhone(mockCustomers, '')).toEqual([]);
  });

  it('builds 3CX URL template cleanly', () => {
    expect(buildScreenPopUrlTemplate('https://cb360.online/')).toBe(
      'https://cb360.online/crm?number=%CallerNumber%&ext=%Agent%&callId=%CallID%'
    );
  });
});

describe('screenPopSchema boundary validation', () => {
  it('parses standard 3CX parameters and aliases', () => {
    const params = new URLSearchParams('number=%2B66823451122&ext=104&callId=call-77');
    const parsed = parseScreenPopQuery(params);
    expect(parsed.normalizedNumber).toBe('0823451122');
    expect(parsed.displayNumber).toBe('082-345-1122');
    expect(parsed.ext).toBe('104');
    expect(parsed.callId).toBe('call-77');
    expect(parsed.direction).toBe('inbound');

    const aliasParams = new URLSearchParams('phone=0818925678&agent=201&callid=99&direction=outbound');
    const aliasParsed = parseScreenPopQuery(aliasParams);
    expect(aliasParsed.normalizedNumber).toBe('0818925678');
    expect(aliasParsed.ext).toBe('201');
    expect(aliasParsed.callId).toBe('99');
    expect(aliasParsed.direction).toBe('outbound');
  });

  it('treats unresolved 3CX placeholders as empty', () => {
    const rawTemplate = new URLSearchParams('number=%CallerNumber%&ext=%Agent%&callId=%CallID%');
    const parsed = parseScreenPopQuery(rawTemplate);
    expect(parsed.rawNumber).toBe('');
    expect(parsed.normalizedNumber).toBe('');
    expect(parsed.ext).toBeUndefined();
    expect(parsed.callId).toBeUndefined();
  });

  it('sanitizes returnTo paths and blocks open redirects', () => {
    expect(sanitizeReturnTo('/crm?number=0823451122&ext=101')).toBe(
      '/crm?number=0823451122&ext=101'
    );
    expect(sanitizeReturnTo('https://evil.example.com')).toBe('/customers/C00123');
    expect(sanitizeReturnTo('//evil.example.com')).toBe('/customers/C00123');
    expect(sanitizeReturnTo('/login?returnTo=/crm')).toBe('/customers/C00123');
    expect(sanitizeReturnTo(null)).toBe('/customers/C00123');
  });

  it('builds a clean CB360 timeline event from an active 3CX call', () => {
    const evt = buildCallTimelineEvent(
      {
        id: 'call-1',
        callId: '3cx-771',
        phone: '082-345-1122',
        normalizedPhone: '0823451122',
        ext: '101',
        direction: 'inbound',
        status: 'Active',
        durationFormatted: 'กำลังสนทนา',
        timestamp: 'วันนี้ 13:20',
        agentName: 'วิภา ส.',
      },
      'C00124',
      'ลูกค้าแจ้งยืนยันใบสั่งซื้อ PO',
      'วิภา ส.'
    );
    expect(evt.type).toBe('โทร');
    expect(evt.iconCode).toBe('TL');
    expect(evt.customerId).toBe('C00124');
    expect(evt.meta).toContain('Ext: 101');
    expect(evt.meta).toContain('Call ID: 3cx-771');
  });
});
