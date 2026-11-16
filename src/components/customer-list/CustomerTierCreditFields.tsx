import React from 'react';
import type {
  ContactPerson,
  CreateCustomerInput,
  CreditGrade,
  CustomerType,
  TierType,
} from '../../types';
import { PersonNameDraft, PersonNameFields } from '../customer-360/PersonNameFields';
import type { CorporateDraft } from '../customer-360/CorporateIdentityFields';
import { formatPersonFullName } from '../../domain/customer/personName';

const buildContactFromDraft = (
  draft: PersonNameDraft,
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

export const buildCreateCustomerPayload = (params: {
  customerType: CustomerType;
  personDraft: PersonNameDraft;
  corpDraft: CorporateDraft;
  contactDraft: PersonNameDraft;
  contactRole: string;
  phone: string;
  email: string;
  tier: TierType;
  creditGrade: CreditGrade;
  creditLimit: string;
}): CreateCustomerInput | null => {
  const cleanPhone = params.phone.trim();
  const cleanEmail = params.email.trim();
  if (!cleanPhone) return null;

  if (params.customerType === 'CORPORATE') {
    const companyName = params.corpDraft.companyName.trim();
    if (!companyName) return null;
    const contacts = params.contactDraft.firstName.trim()
      ? [
          buildContactFromDraft(
            params.contactDraft,
            params.contactRole.trim() || 'ผู้ติดต่อหลัก',
            cleanPhone,
            cleanEmail
          ),
        ]
      : [];
    return {
      name: companyName,
      companyName,
      taxId: params.corpDraft.taxId.trim() || undefined,
      branchCode: params.corpDraft.branchCode.trim() || undefined,
      customerType: 'CORPORATE',
      phone: cleanPhone,
      email: cleanEmail,
      tier: params.tier,
      creditGrade: params.creditGrade,
      creditLimit: Number(params.creditLimit) || 50000,
      contacts,
    };
  }

  const firstName = params.personDraft.firstName.trim();
  if (!firstName) return null;
  const fullName = formatPersonFullName(params.personDraft);
  return {
    name: fullName,
    prefix: params.personDraft.prefix.trim() || undefined,
    firstName,
    lastName: params.personDraft.lastName.trim() || undefined,
    nickname: params.personDraft.nickname.trim() || undefined,
    customerType: 'INDIVIDUAL',
    phone: cleanPhone,
    email: cleanEmail,
    tier: params.tier,
    creditGrade: params.creditGrade,
    creditLimit: Number(params.creditLimit) || 50000,
    contacts: [buildContactFromDraft(params.personDraft, 'ผู้สั่งซื้อ', cleanPhone, cleanEmail)],
  };
};

interface CorporatePrimaryContactSectionProps {
  contactRole: string;
  onRoleChange: (role: string) => void;
  personDraft: PersonNameDraft;
  onPersonChange: (next: PersonNameDraft) => void;
}

export const CorporatePrimaryContactSection: React.FC<CorporatePrimaryContactSectionProps> = ({
  contactRole,
  onRoleChange,
  personDraft,
  onPersonChange,
}) => (
  <div className="p-2.5 rounded-lg border border-border bg-bg-subtle/50 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-text-primary">
        ผู้ติดต่อหลัก (Primary Contact)
      </span>
      <input
        type="text"
        value={contactRole}
        onChange={(e) => onRoleChange(e.target.value)}
        placeholder="ตำแหน่ง เช่น ฝ่ายจัดซื้อ"
        className="w-40 px-2 py-1 border border-border rounded text-[11px] bg-white"
      />
    </div>
    <PersonNameFields
      value={personDraft}
      onChange={onPersonChange}
      firstNameRequired={false}
      compact
    />
  </div>
);

interface CustomerTierCreditFieldsProps {
  tier: TierType;
  creditGrade: CreditGrade;
  creditLimit: string;
  onTierChange: (tier: TierType) => void;
  onGradeChange: (grade: CreditGrade) => void;
  onLimitChange: (limit: string) => void;
}

export const CustomerTierCreditFields: React.FC<CustomerTierCreditFieldsProps> = ({
  tier,
  creditGrade,
  creditLimit,
  onTierChange,
  onGradeChange,
  onLimitChange,
}) => (
  <div className="grid grid-cols-3 gap-2.5">
    <div>
      <label className="block text-text-secondary font-medium mb-1">ระดับ (Tier)</label>
      <select
        value={tier}
        onChange={(e) => onTierChange(e.target.value as TierType)}
        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white"
      >
        <option value="MEMBER">MEMBER</option>
        <option value="SILVER">SILVER</option>
        <option value="GOLD">GOLD</option>
        <option value="PLATINUM">PLATINUM</option>
      </select>
    </div>
    <div>
      <label className="block text-text-secondary font-medium mb-1">เกรดเครดิต</label>
      <select
        value={creditGrade}
        onChange={(e) => onGradeChange(e.target.value as CreditGrade)}
        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white"
      >
        <option value="A">Grade A</option>
        <option value="B">Grade B</option>
        <option value="C">Grade C</option>
        <option value="D">Grade D</option>
      </select>
    </div>
    <div>
      <label className="block text-text-secondary font-medium mb-1">วงเงินเริ่มต้น (฿)</label>
      <input
        type="number"
        value={creditLimit}
        onChange={(e) => onLimitChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-white"
      />
    </div>
  </div>
);
