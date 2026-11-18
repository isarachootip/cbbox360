import type { ContactPerson, Customer, CustomerAddress } from '../../types';
import { normalizeContactInput } from './customerMutations';
import { setDefaultAddress as setDefaultAddressHelper } from '../../utils/customerHelpers';

export const EMPTY_TENANT_CONTACT: Customer = {
  id: 'EMPTY',
  name: 'ยังไม่มีข้อมูลผู้ติดต่อ',
  initials: '--',
  tier: 'MEMBER',
  creditGrade: 'A',
  segments: [],
  lifetimeValue: 0,
  spend12Months: 0,
  orders12Months: 0,
  lastOrderDaysAgo: 0,
  lastOrderCode: '-',
  lastOrderAmount: 0,
  tierValidUntil: '-',
  tierProgressPercent: 0,
  tierTargetSpend: 0,
  phone: '-',
  fullPhone: '',
  email: '-',
  channels: { line: false, facebook: false },
  birthday: '-',
  customerSince: '-',
  consent: { marketingLine: false, marketingEmail: false, marketingSms: false },
  creditLimit: 0,
  creditUsed: 0,
  creditOverdue: 0,
  churnRisk: 'ต่ำ',
  nextBestAction: { description: 'เพิ่มข้อมูลผู้ติดต่อรายแรกในระบบ', actionLabel: 'เพิ่มรายการใหม่' },
};

export const appendContactToCustomer = (c: Customer, data: Omit<ContactPerson, 'id'>): Customer => {
  const newContact: ContactPerson = { ...normalizeContactInput(data), id: `cnt-${Date.now()}` };
  const existing = c.contacts || [];
  const contacts = newContact.isPrimary
    ? existing.map((cnt) => ({ ...cnt, isPrimary: false })).concat(newContact)
    : [...existing, newContact];
  return { ...c, contacts };
};

export const replaceContactInCustomer = (c: Customer, updated: ContactPerson): Customer => {
  const norm: ContactPerson = { ...normalizeContactInput(updated), id: updated.id };
  return {
    ...c,
    contacts: (c.contacts || []).map((cnt) => {
      if (cnt.id === norm.id) return norm;
      if (norm.isPrimary && cnt.isPrimary) return { ...cnt, isPrimary: false };
      return cnt;
    }),
  };
};

export const appendAddressToCustomer = (c: Customer, data: Omit<CustomerAddress, 'id'>): Customer => {
  const newAddr: CustomerAddress = { ...data, id: `addr-${Date.now()}` };
  let updated = c.addresses || [];
  if (newAddr.isDefaultBilling) updated = updated.map((a) => ({ ...a, isDefaultBilling: false }));
  if (newAddr.isDefaultShipping) updated = updated.map((a) => ({ ...a, isDefaultShipping: false }));
  return { ...c, addresses: [...updated, newAddr] };
};

export const replaceAddressInCustomer = (c: Customer, updatedAddr: CustomerAddress): Customer => ({
  ...c,
  addresses: (c.addresses || []).map((a) => {
    if (a.id === updatedAddr.id) return updatedAddr;
    const copy = { ...a };
    if (updatedAddr.isDefaultBilling && copy.isDefaultBilling) copy.isDefaultBilling = false;
    if (updatedAddr.isDefaultShipping && copy.isDefaultShipping) copy.isDefaultShipping = false;
    return copy;
  }),
});

export const markDefaultAddressInCustomer = (
  c: Customer,
  addressId: string,
  type: 'billing' | 'shipping'
): Customer => ({
  ...c,
  addresses: setDefaultAddressHelper(c.addresses || [], addressId, type),
});
