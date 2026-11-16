import React from 'react';
import { User, Building2 } from 'lucide-react';
import type { CustomerType } from '../../types';

interface CustomerTypeToggleProps {
  value: CustomerType;
  onChange: (next: CustomerType) => void;
}

export const CustomerTypeToggle: React.FC<CustomerTypeToggleProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2 p-1.5 bg-bg-subtle rounded-xl border border-border">
    <button
      type="button"
      onClick={() => onChange('INDIVIDUAL')}
      className={`py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
        value === 'INDIVIDUAL'
          ? 'bg-white shadow-card text-brand border border-border/60'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      <User className="w-4 h-4" />
      <span>บุคคลธรรมดา (B2C)</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('CORPORATE')}
      className={`py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
        value === 'CORPORATE'
          ? 'bg-white shadow-card text-brand border border-border/60'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      <Building2 className="w-4 h-4" />
      <span>นิติบุคคล / องค์กร (B2B)</span>
    </button>
  </div>
);

export interface CorporateDraft {
  companyName: string;
  taxId: string;
  branchCode: string;
}

interface CorporateIdentityFieldsProps {
  value: CorporateDraft;
  onChange: (next: CorporateDraft) => void;
  companyNameError?: string;
  taxIdError?: string;
  autoFocusCompanyName?: boolean;
}

export const CorporateIdentityFields: React.FC<CorporateIdentityFieldsProps> = ({
  value,
  onChange,
  companyNameError,
  taxIdError,
  autoFocusCompanyName = false,
}) => {
  const baseInput =
    'w-full px-3.5 py-2.5 border rounded-lg bg-white text-text-primary text-sm transition-all focus:outline-none focus:ring-2';
  const normalBorder = 'border-border focus:border-brand focus:ring-brand/20';
  const errorBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <div className="space-y-3.5">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          ชื่อบริษัท / องค์กร <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          autoFocus={autoFocusCompanyName}
          required
          value={value.companyName}
          onChange={(e) => onChange({ ...value, companyName: e.target.value })}
          placeholder="เช่น บริษัท นำชัยการพิมพ์ จำกัด"
          aria-invalid={Boolean(companyNameError)}
          className={`${baseInput} ${companyNameError ? errorBorder : normalBorder}`}
        />
        {companyNameError && (
          <p className="mt-1 text-xs font-medium text-rose-600">{companyNameError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            เลขประจำตัวผู้เสียภาษี (13 หลัก)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={17}
            value={value.taxId}
            onChange={(e) => onChange({ ...value, taxId: e.target.value })}
            placeholder="0105558xxxxxx"
            aria-invalid={Boolean(taxIdError)}
            className={`${baseInput} font-mono ${taxIdError ? errorBorder : normalBorder}`}
          />
          {taxIdError && (
            <p className="mt-1 text-xs font-medium text-rose-600">{taxIdError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            รหัสสาขา
          </label>
          <input
            type="text"
            value={value.branchCode}
            onChange={(e) => onChange({ ...value, branchCode: e.target.value })}
            placeholder="00000 (สำนักงานใหญ่)"
            className={`${baseInput} font-mono ${normalBorder}`}
          />
        </div>
      </div>
    </div>
  );
};
