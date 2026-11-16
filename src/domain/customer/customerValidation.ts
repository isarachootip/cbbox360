import { z } from 'zod';
import type {
  ContactPerson,
  CreateCustomerInput,
  CreditGrade,
  CustomerType,
  TierType,
  UpdateCustomerInput,
} from '../../types';
import { formatPersonFullName } from './personName';

export interface PersonNameInput { prefix: string; firstName: string; lastName: string; nickname: string }
export interface CorporateIdentityInput { companyName: string; taxId: string; branchCode: string }

export interface CustomerFormErrors {
  firstName?: string;
  companyName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  creditLimit?: string;
}

export interface CreateCustomerFormParams {
  customerType: CustomerType;
  personDraft: PersonNameInput;
  corpDraft: CorporateIdentityInput;
  contactDraft: PersonNameInput;
  contactRole: string;
  phone: string;
  email: string;
  tier: TierType;
  creditGrade: CreditGrade;
  creditLimit: string;
}

export interface EditCustomerFormParams {
  customerType: CustomerType;
  personDraft: PersonNameInput;
  corpDraft: CorporateIdentityInput;
  phone: string;
  email: string;
  birthday: string;
}

const emailCheck = z.string().email();
const normalizeTaxId = (raw: string): string => raw.replace(/[\s-]/g, '');

export const computeNextCustomerId = (existing: readonly { id: string }[]): string => {
  let maxNumeric = 122;
  for (const item of existing) {
    const match = /^C(\d+)$/i.exec(item.id.trim());
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumeric) maxNumeric = parsed;
    }
  }
  return `C${(maxNumeric + 1).toString().padStart(5, '0')}`;
};

const buildContact = (
  draft: PersonNameInput,
  roleOrTitle: string,
  phone: string,
  email: string
): ContactPerson => ({
  id: `cnt-${Date.now()}`,
  prefix: draft.prefix.trim() || undefined,
  firstName: draft.firstName.trim(),
  lastName: draft.lastName.trim() || undefined,
  nickname: draft.nickname.trim() || undefined,
  name: formatPersonFullName(draft),
  roleOrTitle,
  phone,
  email: email || undefined,
  isPrimary: true,
});

const validateIdentityAndContact = (
  customerType: CustomerType,
  personDraft: PersonNameInput,
  corpDraft: CorporateIdentityInput,
  cleanPhone: string,
  cleanEmail: string
): CustomerFormErrors => {
  const errors: CustomerFormErrors = {};
  if (!cleanPhone) errors.phone = 'กรุณาระบุเบอร์โทรศัพท์หลัก';
  else if (!/\d{4,}/.test(cleanPhone)) errors.phone = 'กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง';

  if (cleanEmail && !emailCheck.safeParse(cleanEmail).success) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง (เช่น contact@company.com)';
  }

  if (customerType === 'CORPORATE') {
    const cleanTaxId = normalizeTaxId(corpDraft.taxId);
    if (!corpDraft.companyName.trim()) errors.companyName = 'กรุณาระบุชื่อบริษัท / องค์กร';
    if (cleanTaxId && !/^\d{13}$/.test(cleanTaxId)) {
      errors.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    }
  } else if (!personDraft.firstName.trim()) {
    errors.firstName = 'กรุณาระบุชื่อลูกค้า';
  }
  return errors;
};

export const validateAndBuildCreateCustomer = (
  params: CreateCustomerFormParams
): { ok: true; payload: CreateCustomerInput } | { ok: false; errors: CustomerFormErrors } => {
  const cleanPhone = params.phone.trim();
  const cleanEmail = params.email.trim();
  const rawLimit = params.creditLimit.trim();
  const parsedLimit = rawLimit === '' ? 50000 : Number(rawLimit);
  const errors = validateIdentityAndContact(params.customerType, params.personDraft, params.corpDraft, cleanPhone, cleanEmail);

  if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
    errors.creditLimit = 'วงเงินเริ่มต้นต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป';
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (params.customerType === 'CORPORATE') {
    const companyName = params.corpDraft.companyName.trim();
    const cleanTaxId = normalizeTaxId(params.corpDraft.taxId);
    const contacts = params.contactDraft.firstName.trim()
      ? [buildContact(params.contactDraft, params.contactRole.trim() || 'ผู้ติดต่อหลัก', cleanPhone, cleanEmail)]
      : [];
    return {
      ok: true,
      payload: {
        name: companyName,
        companyName,
        taxId: cleanTaxId || undefined,
        branchCode: params.corpDraft.branchCode.trim() || undefined,
        customerType: 'CORPORATE',
        phone: cleanPhone,
        email: cleanEmail,
        tier: params.tier,
        creditGrade: params.creditGrade,
        creditLimit: parsedLimit,
        contacts,
      },
    };
  }

  return {
    ok: true,
    payload: {
      name: formatPersonFullName(params.personDraft),
      prefix: params.personDraft.prefix.trim() || undefined,
      firstName: params.personDraft.firstName.trim(),
      lastName: params.personDraft.lastName.trim() || undefined,
      nickname: params.personDraft.nickname.trim() || undefined,
      customerType: 'INDIVIDUAL',
      phone: cleanPhone,
      email: cleanEmail,
      tier: params.tier,
      creditGrade: params.creditGrade,
      creditLimit: parsedLimit,
      contacts: [buildContact(params.personDraft, 'ผู้สั่งซื้อ', cleanPhone, cleanEmail)],
    },
  };
};

export const validateEditCustomerInput = (
  params: EditCustomerFormParams
): { ok: true; updates: UpdateCustomerInput } | { ok: false; errors: CustomerFormErrors } => {
  const cleanPhone = params.phone.trim();
  const cleanEmail = params.email.trim();
  const errors = validateIdentityAndContact(params.customerType, params.personDraft, params.corpDraft, cleanPhone, cleanEmail);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const shared = {
    phone: cleanPhone,
    fullPhone: cleanPhone,
    email: cleanEmail,
    birthday: params.birthday.trim() || '-',
  };

  if (params.customerType === 'CORPORATE') {
    return {
      ok: true,
      updates: {
        ...shared,
        customerType: 'CORPORATE',
        companyName: params.corpDraft.companyName.trim(),
        taxId: normalizeTaxId(params.corpDraft.taxId),
        branchCode: params.corpDraft.branchCode.trim(),
      },
    };
  }

  return {
    ok: true,
    updates: {
      ...shared,
      customerType: 'INDIVIDUAL',
      prefix: params.personDraft.prefix.trim(),
      firstName: params.personDraft.firstName.trim(),
      lastName: params.personDraft.lastName.trim(),
      nickname: params.personDraft.nickname.trim(),
    },
  };
};
