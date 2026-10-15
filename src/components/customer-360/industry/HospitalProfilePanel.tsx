import React, { useState } from 'react';
import { Pencil, Stethoscope } from 'lucide-react';
import { HospitalProfile, MedicalAccess } from '../../../types/industryProfile';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { getPolicyStatus } from '../../../domain/industry/hospitalRules';
import { HOSPITAL_FIELDS, NURSE_EDITABLE_FIELDS } from '../../../../shared/medicalAccessPolicy.js';
import { HospitalProfileForm } from './HospitalProfileForm';
import { COVERAGE_LABELS } from './InsurancePolicyEditor';
import { EXPIRY_DISPLAY, IndustryStatusDot } from './IndustryStatusDot';
import { primaryButtonClass, secondaryButtonClass } from './FormErrorList';

const NURSE_LOCKED_FIELDS: ReadonlySet<string> = new Set(
  HOSPITAL_FIELDS.filter((f) => !(NURSE_EDITABLE_FIELDS as readonly string[]).includes(f))
);

interface HospitalProfilePanelProps {
  profile: HospitalProfile | null;
  access: MedicalAccess;
  onSave: UseIndustryProfileResult['save'];
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-xs border-b border-divider last:border-0">
    <span className="text-text-secondary shrink-0">{label}</span>
    <span className="font-semibold text-text-primary text-right">{children}</span>
  </div>
);

export const HospitalProfilePanel: React.FC<HospitalProfilePanelProps> = ({ profile, access, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const today = new Date();
  const isNurse = access === 'nurse';

  if (isEditing) {
    return (
      <HospitalProfileForm
        initial={profile}
        lockedFields={isNurse ? NURSE_LOCKED_FIELDS : undefined}
        onSave={onSave}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  if (!profile) {
    return (
      <div className="py-10 text-center space-y-3">
        <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs text-text-secondary">ยังไม่มีข้อมูลผู้ป่วยสำหรับลูกค้ารายนี้</p>
        {isNurse ? (
          <p className="text-[11px] text-text-muted">การสร้างข้อมูลผู้ป่วยใหม่ต้องทำโดยแพทย์หรือ admin</p>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className={primaryButtonClass}>
            สร้างข้อมูลผู้ป่วย
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">ข้อมูลผู้ป่วย (HN {profile.hn})</h3>
        <button type="button" onClick={() => setIsEditing(true)} className={`${secondaryButtonClass} flex items-center gap-1`}>
          <Pencil className="w-3.5 h-3.5" />
          <span>แก้ไข</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <Row label="กรุ๊ปเลือด">{profile.bloodType === 'unknown' ? 'ไม่ทราบ' : profile.bloodType}</Row>
          <Row label="แพทย์ประจำ">{profile.preferredDoctor ?? '—'}</Row>
          <Row label="ผู้ติดต่อฉุกเฉิน">
            {profile.emergencyContact
              ? `${profile.emergencyContact.name} (${profile.emergencyContact.relation}) ${profile.emergencyContact.phone}`
              : '—'}
          </Row>
        </div>
        <div>
          <Row label="แพ้ยา">
            {profile.drugAllergies.length > 0 ? (
              <span className="text-red-600">{profile.drugAllergies.join(', ')}</span>
            ) : (
              'ไม่มีประวัติ'
            )}
          </Row>
          <Row label="โรคประจำตัว">{profile.chronicConditions.join(', ') || '—'}</Row>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-primary">สิทธิ์การรักษา / ประกัน</h4>
        {profile.insurancePolicies.length === 0 && <p className="text-xs text-text-muted">ยังไม่มีข้อมูลสิทธิ์</p>}
        {profile.insurancePolicies.map((policy) => (
          <div key={policy.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border text-xs">
            <div>
              <div className="font-semibold text-text-primary">{policy.provider}</div>
              <div className="text-[11px] text-text-secondary">
                {COVERAGE_LABELS[policy.coverageType]} · {policy.policyNo}
                {policy.validUntil && ` · ถึง ${policy.validUntil}`}
              </div>
            </div>
            <IndustryStatusDot {...EXPIRY_DISPLAY[getPolicyStatus(policy, today)]} />
          </div>
        ))}
      </div>
    </div>
  );
};
