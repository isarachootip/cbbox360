import { ContactPerson, CustomerAddress } from '../types';

/**
 * Sets a specific contact as primary and demotes all other contacts.
 */
export const setPrimaryContact = (
  contacts: ContactPerson[],
  newPrimaryId: string
): ContactPerson[] => {
  return contacts.map((c) => ({
    ...c,
    isPrimary: c.id === newPrimaryId,
  }));
};

/**
 * Updates default shipping or billing address exclusively.
 */
export const setDefaultAddress = (
  addresses: CustomerAddress[],
  targetId: string,
  type: 'billing' | 'shipping'
): CustomerAddress[] => {
  return addresses.map((a) => ({
    ...a,
    ...(type === 'billing' ? { isDefaultBilling: a.id === targetId } : {}),
    ...(type === 'shipping' ? { isDefaultShipping: a.id === targetId } : {}),
  }));
};

/**
 * Formats a full Thai address string from components.
 */
export const formatFullAddress = (addr: CustomerAddress): string => {
  const parts: string[] = [addr.addressLine1];
  if (addr.subdistrict) parts.push(`ต./แขวง ${addr.subdistrict}`);
  if (addr.district) parts.push(`อ./เขต ${addr.district}`);
  if (addr.province) parts.push(addr.province);
  if (addr.postalCode) parts.push(addr.postalCode);
  return parts.filter(Boolean).join(' ');
};

/**
 * Validates 13-digit Thai tax identification number format.
 */
export const validateTaxId = (taxId: string): boolean => {
  if (!taxId || typeof taxId !== 'string') return false;
  const cleaned = taxId.trim();
  return /^[0-9]{13}$/.test(cleaned);
};
