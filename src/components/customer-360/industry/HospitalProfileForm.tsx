import React, { useState } from 'react';
import { BloodType, HospitalProfile, InsurancePolicy } from '../../../types/industryProfile';
import { FieldError } from '../../../domain/industry/schemas';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { optionalText, splitList } from '../../../utils/formParsers';
import { InsurancePolicyEditor } from './InsurancePolicyEditor';
import {
  FormErrorList,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './FormErrorList';

interface HospitalProfileFormProps {
  initial: HospitalProfile | null;
  /** Fields shown read-only (e.g. for nurses). The server enforces the same rule. */
  lockedFields?: ReadonlySet<string>;
  onSave: UseIndustryProfileResult['save'];
  onDone: () => void;
}

const BLOOD_TYPES: BloodType[] = ['A', 'B', 'AB', 'O', 'unknown'];
const lockedInputClass = `${inputClass} disabled:bg-slate-50 disabled:text-text-muted disabled:cursor-not-allowed`;

export const HospitalProfileForm: React.FC<HospitalProfileFormProps> = ({ initial, lockedFields, onSave, onDone }) => {
  const isLocked = (field: string) => lockedFields?.has(field) ?? false;
  const [hn, setHn] = useState(initial?.hn ?? '');
  const [bloodType, setBloodType] = useState<BloodType>(initial?.bloodType ?? 'unknown');
  const [allergies, setAllergies] = useState(initial?.drugAllergies.join(', ') ?? '');
  const [conditions, setConditions] = useState(initial?.chronicConditions.join(', ') ?? '');
  const [doctor, setDoctor] = useState(initial?.preferredDoctor ?? '');
  const [ecName, setEcName] = useState(initial?.emergencyContact?.name ?? '');
  const [ecPhone, setEcPhone] = useState(initial?.emergencyContact?.phone ?? '');
  const [ecRelation, setEcRelation] = useState(initial?.emergencyContact?.relation ?? '');
  const [policies, setPolicies] = useState<InsurancePolicy[]>(initial?.insurancePolicies ?? []);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasEmergencyContact = [ecName, ecPhone, ecRelation].some((v) => v.trim());
    setIsSaving(true);
    const result = await onSave({
      kind: 'hospital',
      hn: hn.trim(),
      bloodType,
      drugAllergies: splitList(allergies),
      chronicConditions: splitList(conditions),
      insurancePolicies: policies,
      preferredDoctor: optionalText(doctor),
      emergencyContact: hasEmergencyContact
        ? { name: ecName.trim(), phone: ecPhone.trim(), relation: ecRelation.trim() }
        : undefined,
    });
    setIsSaving(false);
    if (result.ok) onDone();
    else setErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {lockedFields && (
        <p className="text-[11px] text-text-muted">ตำแหน่งพยาบาลแก้ไขได้เฉพาะ แพ้ยา, สิทธิ์การรักษา และผู้ติดต่อฉุกเฉิน</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>HN (รหัสผู้ป่วย) *</label>
          <input className={lockedInputClass} disabled={isLocked('hn')} value={hn} onChange={(e) => setHn(e.target.value)} placeholder="HN-6904812" />
        </div>
        <div>
          <label className={labelClass}>กรุ๊ปเลือด</label>
          <select className={lockedInputClass} disabled={isLocked('bloodType')} value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodType)}>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b === 'unknown' ? 'ไม่ทราบ' : b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>แพทย์ประจำ</label>
          <input className={lockedInputClass} disabled={isLocked('preferredDoctor')} value={doctor} onChange={(e) => setDoctor(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>ประวัติแพ้ยา (คั่นด้วย ,)</label>
          <input className={lockedInputClass} disabled={isLocked('drugAllergies')} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Penicillin, Aspirin" />
        </div>
        <div>
          <label className={labelClass}>โรคประจำตัว (คั่นด้วย ,)</label>
          <input className={lockedInputClass} disabled={isLocked('chronicConditions')} value={conditions} onChange={(e) => setConditions(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>สิทธิ์การรักษา / ประกัน</label>
        <InsurancePolicyEditor policies={policies} onChange={setPolicies} />
      </div>

      <div>
        <label className={labelClass}>ผู้ติดต่อฉุกเฉิน</label>
        <div className="grid grid-cols-3 gap-2">
          <input className={inputClass} placeholder="ชื่อ" value={ecName} onChange={(e) => setEcName(e.target.value)} />
          <input className={inputClass} placeholder="เบอร์โทร" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
          <input className={inputClass} placeholder="ความสัมพันธ์" value={ecRelation} onChange={(e) => setEcRelation(e.target.value)} />
        </div>
      </div>

      <FormErrorList errors={errors} />

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          ยกเลิก
        </button>
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้ป่วย'}
        </button>
      </div>
    </form>
  );
};
