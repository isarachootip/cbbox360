import React from 'react';
import { User, Building2 } from 'lucide-react';
import type { CustomerType } from '../../types';

interface CustomerTypeToggleProps {
  value: CustomerType;
  onChange: (next: CustomerType) => void;
}

export const CustomerTypeToggle: React.FC<CustomerTypeToggleProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2 p-1 bg-bg-subtle rounded-lg border border-border">
    <button
      type="button"
      onClick={() => onChange('INDIVIDUAL')}
      className={`py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
        value === 'INDIVIDUAL' ? 'bg-white shadow-xs text-brand' : 'text-text-secondary'
      }`}
    >
      <User className="w-3.5 h-3.5" />
      <span>บุคคลธรรมดา (B2C)</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('CORPORATE')}
      className={`py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
        value === 'CORPORATE' ? 'bg-white shadow-xs text-brand' : 'text-text-secondary'
      }`}
    >
      <Building2 className="w-3.5 h-3.5" />
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
}

export const CorporateIdentityFields: React.FC<CorporateIdentityFieldsProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-2.5">
    <div>
      <label className="block text-text-secondary font-medium mb-1">
        ชื่อบริษัท / องค์กร <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        required
        value={value.companyName}
        onChange={(e) => onChange({ ...value, companyName: e.target.value })}
        placeholder="เช่น บริษัท นำชัยการพิมพ์ จำกัด"
        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary text-xs"
      />
    </div>
    <div className="grid grid-cols-2 gap-2.5">
      <div>
        <label className="block text-text-secondary font-medium mb-1">
          เลขประจำตัวผู้เสียภาษี (13 หลัก)
        </label>
        <input
          type="text"
          value={value.taxId}
          onChange={(e) => onChange({ ...value, taxId: e.target.value })}
          placeholder="0105558xxxxxx"
          className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
        />
      </div>
      <div>
        <label className="block text-text-secondary font-medium mb-1">รหัสสาขา</label>
        <input
          type="text"
          value={value.branchCode}
          onChange={(e) => onChange({ ...value, branchCode: e.target.value })}
          placeholder="00000 (สำนักงานใหญ่)"
          className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
        />
      </div>
    </div>
  </div>
);
