import type {
  ContactPerson,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from '../../types';
import {
  computeCustomerInitials,
  normalizePersonRecord,
} from './personName';

export const normalizeContactInput = (
  contact: Omit<ContactPerson, 'id'>
): Omit<ContactPerson, 'id'> => {
  const normalized = normalizePersonRecord(contact);
  return {
    ...contact,
    ...normalized,
  };
};

export const applyCustomerUpdate = (
  customer: Customer,
  updates: UpdateCustomerInput
): Customer => {
  const customerType = updates.customerType ?? customer.customerType ?? 'INDIVIDUAL';
  const nextPhone = updates.phone !== undefined ? updates.phone.trim() : customer.phone;
  const nextFullPhone =
    updates.fullPhone !== undefined
      ? updates.fullPhone.trim()
      : updates.phone !== undefined
        ? updates.phone.trim()
        : customer.fullPhone;
  const nextEmail = updates.email !== undefined ? updates.email.trim() : customer.email;
  const nextBirthday =
    updates.birthday !== undefined ? updates.birthday.trim() || '-' : customer.birthday;

  if (customerType === 'CORPORATE') {
    const companyName = (
      updates.companyName ??
      customer.companyName ??
      customer.name
    ).trim();
    const displayName = companyName || customer.name;
    return {
      ...customer,
      customerType: 'CORPORATE',
      name: displayName,
      companyName: displayName,
      prefix: undefined,
      firstName: undefined,
      lastName: undefined,
      nickname: undefined,
      taxId: updates.taxId !== undefined ? updates.taxId.trim() || undefined : customer.taxId,
      branchCode:
        updates.branchCode !== undefined
          ? updates.branchCode.trim() || undefined
          : customer.branchCode,
      initials: computeCustomerInitials({
        customerType: 'CORPORATE',
        companyName: displayName,
        fallbackName: displayName,
      }),
      phone: nextPhone,
      fullPhone: nextFullPhone,
      email: nextEmail,
      birthday: nextBirthday,
    };
  }

  const normalized = normalizePersonRecord({
    prefix: updates.prefix !== undefined ? updates.prefix : customer.prefix,
    firstName: updates.firstName !== undefined ? updates.firstName : customer.firstName,
    lastName: updates.lastName !== undefined ? updates.lastName : customer.lastName,
    nickname: updates.nickname !== undefined ? updates.nickname : customer.nickname,
    name: customer.name,
  });

  const previousName = customer.name;
  const syncedContacts = (customer.contacts ?? []).map((cnt) => {
    if (cnt.isPrimary && cnt.name === previousName) {
      return {
        ...cnt,
        ...normalized,
        phone: updates.fullPhone?.trim() || updates.phone?.trim() || cnt.phone,
        email: nextEmail || cnt.email,
      };
    }
    return cnt;
  });

  return {
    ...customer,
    customerType: 'INDIVIDUAL',
    ...normalized,
    companyName: undefined,
    initials: computeCustomerInitials({
      customerType: 'INDIVIDUAL',
      ...normalized,
      fallbackName: normalized.name,
    }),
    contacts: syncedContacts,
    phone: nextPhone,
    fullPhone: nextFullPhone,
    email: nextEmail,
    birthday: nextBirthday,
  };
};

export const buildNewCustomerRecord = (
  newId: string,
  customerData: CreateCustomerInput
): Customer => {
  const customerType = customerData.customerType || 'INDIVIDUAL';
  const normalizedPerson =
    customerType === 'INDIVIDUAL'
      ? normalizePersonRecord({
          prefix: customerData.prefix,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          nickname: customerData.nickname,
          name: customerData.name,
        })
      : undefined;

  const displayName =
    customerType === 'CORPORATE'
      ? (customerData.companyName || customerData.name).trim()
      : normalizedPerson?.name || customerData.name.trim();

  const initials = computeCustomerInitials({
    customerType,
    companyName: customerData.companyName || displayName,
    prefix: normalizedPerson?.prefix,
    firstName: normalizedPerson?.firstName,
    lastName: normalizedPerson?.lastName,
    fallbackName: displayName,
  });

  return {
    id: newId,
    name: displayName,
    prefix: normalizedPerson?.prefix,
    firstName: normalizedPerson?.firstName,
    lastName: normalizedPerson?.lastName,
    nickname: normalizedPerson?.nickname,
    customerType,
    companyName: customerType === 'CORPORATE' ? displayName : undefined,
    taxId: customerData.taxId,
    branchCode: customerData.branchCode,
    contacts: (customerData.contacts || []).map((c) => ({
      ...c,
      ...normalizePersonRecord(c),
    })),
    addresses: customerData.addresses || [],
    initials,
    tier: customerData.tier,
    creditGrade: customerData.creditGrade,
    segments: ['New Member'],
    lifetimeValue: 0,
    spend12Months: 0,
    orders12Months: 0,
    lastOrderDaysAgo: 0,
    lastOrderCode: '-',
    lastOrderAmount: 0,
    tierValidUntil: '31 ธ.ค. 2026',
    tierProgressPercent: 0,
    tierTargetSpend: 50000,
    phone: customerData.phone,
    fullPhone: customerData.phone,
    email: customerData.email,
    channels: { line: true, facebook: false, email: true, sms: false },
    birthday: '-',
    customerSince: 'เมื่อสักครู่',
    consent: { marketingLine: true, marketingEmail: true, marketingSms: false },
    creditLimit: customerData.creditLimit || 50000,
    creditUsed: 0,
    creditOverdue: 0,
    churnRisk: 'ต่ำ',
    nextBestAction: {
      description: 'ต้อนรับลูกค้าใหม่และส่งข้อความแนะนำบริการผ่าน LINE',
      actionLabel: 'ส่งข้อความต้อนรับ',
    },
  };
};
