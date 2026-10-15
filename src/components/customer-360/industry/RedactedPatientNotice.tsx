import React from 'react';
import { Lock } from 'lucide-react';
import { RedactedHospitalProfile } from '../../../types/industryProfile';
import { IndustryStatusDot } from './IndustryStatusDot';

/** What non-medical roles see on the patient tab (PDPA data minimisation). */
export const RedactedPatientNotice: React.FC<{ redacted: RedactedHospitalProfile | null }> = ({ redacted }) => (
  <div className="py-8 text-center space-y-3">
    <Lock className="w-8 h-8 text-slate-300 mx-auto" />
    {redacted ? (
      <>
        <p className="text-sm font-bold text-text-primary">HN {redacted.hn}</p>
        <div className="flex justify-center">
          {redacted.hasDrugAllergy ? (
            <IndustryStatusDot tone="red" label="มีข้อมูลแพ้ยา" />
          ) : (
            <IndustryStatusDot tone="slate" label="ไม่มีประวัติแพ้ยา" />
          )}
        </div>
      </>
    ) : (
      <p className="text-xs text-text-secondary">ยังไม่มีข้อมูลผู้ป่วย</p>
    )}
    <p className="text-[11px] text-text-muted max-w-sm mx-auto">
      ข้อมูลการแพทย์เป็นข้อมูลอ่อนไหวตาม PDPA มาตรา 26 — เฉพาะ admin, แพทย์ และพยาบาลเท่านั้นที่ดูรายละเอียดได้
    </p>
  </div>
);
