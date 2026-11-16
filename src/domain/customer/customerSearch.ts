import type { Customer } from '../../types';

const normalizeDigits = (value: string): string => value.replace(/\D/g, '');

/**
 * Tokenized single-box search across customer identity, structured name parts,
 * nickname, corporate fields, unmasked phone numbers, and contact persons.
 *
 * Allows staff to type "สมชาย" and refine with space + lastName ("สมชาย ใจ")
 * in a single search input.
 */
export const matchesCustomerSearch = (customer: Customer, rawQuery: string): boolean => {
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const contacts = customer.contacts ?? [];

  const textCandidates: Array<string | undefined> = [
    customer.id,
    customer.name,
    customer.prefix,
    customer.firstName,
    customer.lastName,
    customer.nickname,
    customer.companyName,
    customer.email,
    customer.taxId,
    customer.phone,
    customer.fullPhone,
    ...contacts.flatMap((cnt) => [
      cnt.name,
      cnt.prefix,
      cnt.firstName,
      cnt.lastName,
      cnt.nickname,
      cnt.roleOrTitle,
      cnt.phone,
      cnt.email,
      cnt.lineId,
    ]),
  ];

  const lowerHaystack = textCandidates
    .filter((item): item is string => Boolean(item && item.trim()))
    .map((item) => item.toLowerCase());

  const digitHaystack = [
    customer.phone,
    customer.fullPhone,
    customer.taxId,
    ...contacts.map((cnt) => cnt.phone),
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalizeDigits)
    .filter((digits) => digits.length > 0);

  return tokens.every((token) => {
    if (lowerHaystack.some((field) => field.includes(token))) {
      return true;
    }
    const tokenDigits = normalizeDigits(token);
    if (tokenDigits.length >= 3) {
      return digitHaystack.some((digits) => digits.includes(tokenDigits));
    }
    return false;
  });
};
