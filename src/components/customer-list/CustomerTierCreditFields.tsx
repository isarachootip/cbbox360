import React from 'react';
import type { CreateCustomerInput, CreditGrade, TierType } from '../../types';
import { PersonNameDraft, PersonNameFields } from '../customer-360/PersonNameFields';
import {
  CreateCustomerFormParams,
  validateAndBuildCreateCustomer,
} from '../../domain/customer/customerValidation';

export const buildCreateCustomerPayload = (
  params: CreateCustomerFormParams
): CreateCustomerInput | null => {
  const result = validateAndBuildCreateCustomer(params);
  return result.ok ? result.payload : null;
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
  <div className="p-4 rounded-xl border border-border bg-bg-subtle/60 space-y-3.5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border/70">
      <div>
        <span className="text-sm font-semibold text-text-primary block">
          ผู้ติดต่อหลักขององค์กร (Primary Contact)
        </span>
        <span className="text-xs text-text-muted">
          ไม่บังคับ · ระบุชื่อและตำแหน่งผู้ประสานงานเพื่อความสะดวกในการติดต่อ
        </span>
      </div>
      <div className="sm:w-60">
        <label className="block text-xs font-medium text-text-secondary mb-1">
          ตำแหน่ง / แผนกงาน
        </label>
        <input
          type="text"
          value={contactRole}
          onChange={(e) => onRoleChange(e.target.value)}
          placeholder="เช่น ผู้จัดการฝ่ายจัดซื้อ"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>
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
  creditLimitError?: string;
  onTierChange: (tier: TierType) => void;
  onGradeChange: (grade: CreditGrade) => void;
  onLimitChange: (limit: string) => void;
}

export const CustomerTierCreditFields: React.FC<CustomerTierCreditFieldsProps> = ({
  tier,
  creditGrade,
  creditLimit,
  creditLimitError,
  onTierChange,
  onGradeChange,
  onLimitChange,
}) => {
  const inputBase =
    'w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white text-text-primary transition-all focus:outline-none focus:ring-2';
  const normalBorder = 'border-border focus:border-brand focus:ring-brand/20';
  const errorBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <div className="pt-3 border-t border-divider">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            ระดับสมาชิก (Tier)
          </label>
          <select
            value={tier}
            onChange={(e) => onTierChange(e.target.value as TierType)}
            className={`${inputBase} ${normalBorder}`}
          >
            <option value="MEMBER">MEMBER</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
            <option value="PLATINUM">PLATINUM</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            เกรดเครดิต
          </label>
          <select
            value={creditGrade}
            onChange={(e) => onGradeChange(e.target.value as CreditGrade)}
            className={`${inputBase} ${normalBorder}`}
          >
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            วงเงินเริ่มต้น (฿)
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={creditLimit}
            onChange={(e) => onLimitChange(e.target.value)}
            aria-invalid={Boolean(creditLimitError)}
            className={`${inputBase} font-mono ${creditLimitError ? errorBorder : normalBorder}`}
          />
          {creditLimitError && (
            <p className="mt-1 text-xs font-medium text-rose-600">{creditLimitError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
