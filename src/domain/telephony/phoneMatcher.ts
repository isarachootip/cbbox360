import type { Customer, CustomerPhoneMatch } from '../../types';

const isPlaceholderToken = (value: string): boolean =>
  value.includes('%') || value.includes('\uFFFD') || /^\{[^}]+\}$/.test(value.trim());

/**
 * Normalizes a Thai or international phone string into canonical digits (e.g. "0823451122").
 * Returns "" for empty inputs, unresolved PBX placeholders, or masked numbers ("081-xxx-5678").
 */
export const normalizeThaiPhone = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed || isPlaceholderToken(trimmed)) {
    return '';
  }

  // Strip internal extension suffixes ("ต่อ 102", "ext. 102", "#102") before checking masks
  const withoutExt = trimmed.replace(/\s*(?:ต่อ|ext\.?|#)\s*\d+.*$/i, '');
  if (/[xX*•]/.test(withoutExt)) {
    return '';
  }

  let digits = withoutExt.replace(/\D/g, '');
  if (digits.length < 3) {
    return '';
  }

  // International +66 / 0066 / space-decoded 66 -> domestic 0
  if (digits.startsWith('0066') && digits.length >= 12) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('66') && (digits.length === 10 || digits.length === 11)) {
    digits = `0${digits.slice(2)}`;
  }

  // Outbound/inbound PBX trunk prefix "9" before domestic 0-leading numbers
  if (digits.startsWith('90') && (digits.length === 10 || digits.length === 11)) {
    digits = digits.slice(1);
  }

  return digits;
};

/**
 * Formats a normalized Thai phone number with standard dashes for display and form prefill.
 */
export const formatThaiPhoneDisplay = (rawOrNormalized: string): string => {
  const norm = normalizeThaiPhone(rawOrNormalized);
  if (!norm) {
    return rawOrNormalized.trim();
  }
  if (norm.length === 10 && norm.startsWith('0')) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 6)}-${norm.slice(6)}`;
  }
  if (norm.length === 9 && norm.startsWith('02')) {
    return `${norm.slice(0, 2)}-${norm.slice(2, 5)}-${norm.slice(5)}`;
  }
  if (norm.length === 9 && norm.startsWith('0')) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 6)}-${norm.slice(6)}`;
  }
  return norm;
};

/**
 * Searches across primary phone, corporate contact persons, and shipping/billing addresses.
 * Deduplicates per customer (priority: primary > contact > address).
 */
export const matchCustomersByPhone = (
  customers: Customer[],
  rawInput: string
): CustomerPhoneMatch[] => {
  const target = normalizeThaiPhone(rawInput);
  if (!target) {
    return [];
  }

  const results: CustomerPhoneMatch[] = [];

  for (const customer of customers) {
    const primaryCandidate = customer.fullPhone || customer.phone;
    if (normalizeThaiPhone(primaryCandidate) === target) {
      const primaryContact = customer.contacts?.find(
        (cnt) => normalizeThaiPhone(cnt.phone) === target
      );
      results.push({
        customer,
        matchedField: 'primary',
        matchedLabel: primaryContact
          ? `${primaryContact.name} (${primaryContact.roleOrTitle})`
          : 'เบอร์หลักลูกค้า',
        matchedRawPhone: primaryCandidate,
        normalizedPhone: target,
      });
      continue;
    }

    const matchedContact = customer.contacts?.find(
      (cnt) => normalizeThaiPhone(cnt.phone) === target
    );
    if (matchedContact) {
      results.push({
        customer,
        matchedField: 'contact',
        matchedLabel: `${matchedContact.name} (${matchedContact.roleOrTitle})`,
        matchedRawPhone: matchedContact.phone,
        normalizedPhone: target,
      });
      continue;
    }

    const matchedAddress = customer.addresses?.find(
      (addr) => addr.receiverPhone && normalizeThaiPhone(addr.receiverPhone) === target
    );
    if (matchedAddress && matchedAddress.receiverPhone) {
      results.push({
        customer,
        matchedField: 'address',
        matchedLabel: matchedAddress.receiverName
          ? `${matchedAddress.receiverName} (${matchedAddress.title})`
          : matchedAddress.title,
        matchedRawPhone: matchedAddress.receiverPhone,
        normalizedPhone: target,
      });
    }
  }

  return results;
};

/**
 * Builds the canonical 3CX / Telephony Screen-Pop URL template for the current CB360 origin.
 */
export const buildScreenPopUrlTemplate = (origin: string): string => {
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/crm?number=%CallerNumber%&ext=%Agent%&callId=%CallID%`;
};
