import React, { useState } from 'react';
import {
  ContactCenterProfile,
  ContactCenterSlaTier,
  ContactPreferredChannel,
  ContactPreferredLanguage,
} from '../../../types/industryProfile';
import { FieldError } from '../../../domain/industry/schemas';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { optionalInt, optionalText } from '../../../utils/formParsers';
import {
  FormErrorList,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './FormErrorList';

export const SLA_TIER_OPTIONS: Record<ContactCenterSlaTier, string> = {
  vip: 'VIP · ตอบกลับและแก้ไขภายใน 1 ชั่วโมง',
  priority: 'Priority · ตอบกลับและแก้ไขภายใน 4 ชั่วโมง',
  standard: 'Standard · ตอบกลับและแก้ไขภายใน 24 ชั่วโมง',
};

export const CHANNEL_OPTIONS: ContactPreferredChannel[] = ['LINE', 'Phone', 'Facebook', 'Email'];
export const LANGUAGE_OPTIONS: Record<ContactPreferredLanguage, string> = {
  TH: 'ภาษาไทย (TH)',
  EN: 'ภาษาอังกฤษ (EN)',
};

interface ContactCenterProfileFormProps {
  initial: ContactCenterProfile | null;
  onSave: UseIndustryProfileResult['save'];
  onDone: () => void;
}

export const ContactCenterProfileForm: React.FC<ContactCenterProfileFormProps> = ({
  initial,
  onSave,
  onDone,
}) => {
  const [slaTier, setSlaTier] = useState<ContactCenterSlaTier>(initial?.slaTier ?? 'standard');
  const [preferredChannel, setPreferredChannel] = useState<ContactPreferredChannel>(
    initial?.preferredChannel ?? 'LINE'
  );
  const [preferredLanguage, setPreferredLanguage] = useState<ContactPreferredLanguage>(
    initial?.preferredLanguage ?? 'TH'
  );
  const [assignedQueue, setAssignedQueue] = useState(
    initial?.assignedQueue ?? 'Customer Care Tier 1'
  );
  const [contractRef, setContractRef] = useState(initial?.contractRef ?? '');
  const [callbackWindow, setCallbackWindow] = useState(initial?.callbackWindow ?? '');
  const [csatStr, setCsatStr] = useState(
    initial?.lastCsatScore !== undefined ? String(initial.lastCsatScore) : ''
  );
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await onSave({
      kind: 'contact_center',
      slaTier,
      preferredChannel,
      preferredLanguage,
      assignedQueue: assignedQueue.trim(),
      contractRef: optionalText(contractRef),
      callbackWindow: optionalText(callbackWindow),
      lastCsatScore: optionalInt(csatStr),
    });
    setIsSaving(false);
    if (result.ok) onDone();
    else setErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>ระดับสิทธิ์การดูแล (SLA Tier)</label>
          <select
            className={inputClass}
            value={slaTier}
            onChange={(e) => setSlaTier(e.target.value as ContactCenterSlaTier)}
          >
            {(Object.keys(SLA_TIER_OPTIONS) as ContactCenterSlaTier[]).map((tier) => (
              <option key={tier} value={tier}>
                {SLA_TIER_OPTIONS[tier]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>ช่องทางติดต่อที่สะดวกหลัก</label>
          <select
            className={inputClass}
            value={preferredChannel}
            onChange={(e) => setPreferredChannel(e.target.value as ContactPreferredChannel)}
          >
            {CHANNEL_OPTIONS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>ภาษาสำหรับรับบริการ</label>
          <select
            className={inputClass}
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as ContactPreferredLanguage)}
          >
            {(Object.keys(LANGUAGE_OPTIONS) as ContactPreferredLanguage[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_OPTIONS[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>ทีมดูแลหลัก (Assigned Queue) *</label>
          <input
            className={inputClass}
            value={assignedQueue}
            onChange={(e) => setAssignedQueue(e.target.value)}
            placeholder="เช่น Tier 2 Escalation Desk"
          />
        </div>
        <div>
          <label className={labelClass}>เลขอ้างอิงสัญญา / สมาชิก</label>
          <input
            className={inputClass}
            value={contractRef}
            onChange={(e) => setContractRef(e.target.value)}
            placeholder="เช่น SLA-2026-0891"
          />
        </div>
        <div>
          <label className={labelClass}>ช่วงเวลาที่สะดวกให้โทรกลับ</label>
          <input
            className={inputClass}
            value={callbackWindow}
            onChange={(e) => setCallbackWindow(e.target.value)}
            placeholder="เช่น 09:00 - 12:00 น."
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label className={labelClass}>คะแนนความพึงพอใจล่าสุด (CSAT 1–5)</label>
        <input
          type="number"
          min={1}
          max={5}
          className={inputClass}
          value={csatStr}
          onChange={(e) => setCsatStr(e.target.value)}
          placeholder="1 ถึง 5"
        />
      </div>

      <FormErrorList errors={errors} />

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          ยกเลิก
        </button>
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์ผู้ติดต่อ'}
        </button>
      </div>
    </form>
  );
};
