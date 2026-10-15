import React, { useState } from 'react';
import { LogisticsProfile, LogisticsServiceType } from '../../../types/industryProfile';
import { FieldError } from '../../../domain/industry/schemas';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { optionalText, splitList } from '../../../utils/formParsers';
import {
  FormErrorList,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './FormErrorList';

export const SERVICE_LABELS: Record<LogisticsServiceType, string> = {
  standard: 'ส่งธรรมดา (Standard)',
  express: 'ส่งด่วน (Express)',
  same_day: 'ส่งภายในวัน (Same Day)',
  freight: 'ขนส่งสินค้าใหญ่ (Freight)',
};

interface LogisticsProfileFormProps {
  initial: LogisticsProfile | null;
  onSave: UseIndustryProfileResult['save'];
  onDone: () => void;
}

export const LogisticsProfileForm: React.FC<LogisticsProfileFormProps> = ({ initial, onSave, onDone }) => {
  const [accountCode, setAccountCode] = useState(initial?.accountCode ?? '');
  const [originBranch, setOriginBranch] = useState(initial?.originBranch ?? '');
  const [service, setService] = useState<LogisticsServiceType>(initial?.defaultService ?? 'standard');
  const [codEnabled, setCodEnabled] = useState(initial?.codEnabled ?? false);
  const [codBank, setCodBank] = useState(initial?.codBankAccount ?? '');
  const [tracking, setTracking] = useState(initial?.recentTrackingNumbers.join(', ') ?? '');
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await onSave({
      kind: 'logistics',
      accountCode: accountCode.trim(),
      originBranch: originBranch.trim(),
      defaultService: service,
      codEnabled,
      codBankAccount: optionalText(codBank),
      recentTrackingNumbers: splitList(tracking),
    });
    setIsSaving(false);
    if (result.ok) onDone();
    else setErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>รหัสบัญชีผู้ส่ง *</label>
          <input className={inputClass} value={accountCode} onChange={(e) => setAccountCode(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>สาขาต้นทาง *</label>
          <input className={inputClass} value={originBranch} onChange={(e) => setOriginBranch(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>บริการที่ใช้ประจำ</label>
          <select className={inputClass} value={service} onChange={(e) => setService(e.target.value as LogisticsServiceType)}>
            {(Object.keys(SERVICE_LABELS) as LogisticsServiceType[]).map((key) => (
              <option key={key} value={key}>
                {SERVICE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="flex items-center gap-2 text-xs font-semibold text-text-primary pb-2">
          <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
          <span>เปิดใช้เก็บเงินปลายทาง (COD)</span>
        </label>
        <div className="md:col-span-2">
          <label className={labelClass}>บัญชีรับเงิน COD {codEnabled && '*'}</label>
          <input className={inputClass} value={codBank} onChange={(e) => setCodBank(e.target.value)} disabled={!codEnabled} />
        </div>
      </div>
      <div>
        <label className={labelClass}>เลขพัสดุล่าสุด (คั่นด้วย , รายการแรก = ล่าสุด)</label>
        <input className={inputClass} value={tracking} onChange={(e) => setTracking(e.target.value)} />
      </div>
      <FormErrorList errors={errors} />
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          ยกเลิก
        </button>
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้ส่ง'}
        </button>
      </div>
    </form>
  );
};
