import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CoverageType, InsurancePolicy } from '../../../types/industryProfile';
import { newId } from '../../../utils/formParsers';
import { inputClass } from './FormErrorList';

export const COVERAGE_LABELS: Record<CoverageType, string> = {
  OPD: 'ผู้ป่วยนอก (OPD)',
  IPD: 'ผู้ป่วยใน (IPD)',
  OPD_IPD: 'OPD + IPD',
  SSO: 'ประกันสังคม',
  UCS: 'บัตรทอง (สปสช.)',
};

interface InsurancePolicyEditorProps {
  policies: InsurancePolicy[];
  onChange: (policies: InsurancePolicy[]) => void;
}

export const InsurancePolicyEditor: React.FC<InsurancePolicyEditorProps> = ({ policies, onChange }) => {
  const update = (id: string, patch: Partial<InsurancePolicy>) =>
    onChange(policies.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const add = () =>
    onChange([...policies, { id: newId('pol'), provider: '', policyNo: '', coverageType: 'OPD_IPD' }]);

  return (
    <div className="space-y-2">
      {policies.map((p) => (
        <div key={p.id} className="grid grid-cols-12 gap-1.5 items-center">
          <input
            className={`${inputClass} col-span-3`}
            placeholder="บริษัทประกัน / สิทธิ์"
            value={p.provider}
            onChange={(e) => update(p.id, { provider: e.target.value })}
          />
          <input
            className={`${inputClass} col-span-3`}
            placeholder="เลขกรมธรรม์"
            value={p.policyNo}
            onChange={(e) => update(p.id, { policyNo: e.target.value })}
          />
          <select
            className={`${inputClass} col-span-3`}
            value={p.coverageType}
            onChange={(e) => update(p.id, { coverageType: e.target.value as CoverageType })}
          >
            {(Object.keys(COVERAGE_LABELS) as CoverageType[]).map((key) => (
              <option key={key} value={key}>
                {COVERAGE_LABELS[key]}
              </option>
            ))}
          </select>
          <input
            type="date"
            className={`${inputClass} col-span-2`}
            value={p.validUntil ?? ''}
            onChange={(e) => update(p.id, { validUntil: e.target.value || undefined })}
          />
          <button
            type="button"
            aria-label="ลบสิทธิ์"
            onClick={() => onChange(policies.filter((x) => x.id !== p.id))}
            className="col-span-1 flex justify-center text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-semibold text-brand flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" />
        <span>เพิ่มสิทธิ์การรักษา</span>
      </button>
    </div>
  );
};
