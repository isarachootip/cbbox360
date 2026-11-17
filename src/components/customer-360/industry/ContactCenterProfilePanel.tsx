import React, { useState } from 'react';
import { Headset, Pencil } from 'lucide-react';
import { ContactCenterProfile, ContactCenterSlaTier } from '../../../types/industryProfile';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import {
  ContactCenterProfileForm,
  LANGUAGE_OPTIONS,
} from './ContactCenterProfileForm';
import { IndustryStatusDot } from './IndustryStatusDot';
import { primaryButtonClass, secondaryButtonClass } from './FormErrorList';

interface ContactCenterProfilePanelProps {
  profile: ContactCenterProfile | null;
  onSave: UseIndustryProfileResult['save'];
}

const SLA_STATUS_DISPLAY: Record<
  ContactCenterSlaTier,
  { tone: 'purple' | 'blue' | 'emerald'; label: string }
> = {
  vip: { tone: 'purple', label: 'VIP (เป้าหมาย 1 ชั่วโมง)' },
  priority: { tone: 'blue', label: 'Priority (เป้าหมาย 4 ชั่วโมง)' },
  standard: { tone: 'emerald', label: 'Standard (เป้าหมาย 24 ชั่วโมง)' },
};

export const ContactCenterProfilePanel: React.FC<ContactCenterProfilePanelProps> = ({
  profile,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ContactCenterProfileForm
        initial={profile}
        onSave={onSave}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  if (!profile) {
    return (
      <div className="py-10 text-center space-y-3">
        <Headset className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs text-text-secondary">
          ยังไม่มีโปรไฟล์ผู้ติดต่อและเงื่อนไข SLA สำหรับลูกค้ารายนี้
        </p>
        <button type="button" onClick={() => setIsEditing(true)} className={primaryButtonClass}>
          ตั้งค่าระดับ SLA & ข้อมูลผู้ติดต่อ
        </button>
      </div>
    );
  }

  const slaDisplay = SLA_STATUS_DISPLAY[profile.slaTier];
  const csatDisplay =
    profile.lastCsatScore === undefined
      ? { tone: 'slate' as const, label: 'ยังไม่มีผลประเมิน' }
      : profile.lastCsatScore >= 4
      ? { tone: 'emerald' as const, label: `${profile.lastCsatScore} / 5 คะแนน (พึงพอใจมาก)` }
      : profile.lastCsatScore === 3
      ? { tone: 'amber' as const, label: '3 / 5 คะแนน (ปานกลาง)' }
      : { tone: 'red' as const, label: `${profile.lastCsatScore} / 5 คะแนน (ต้องติดตามเร่งด่วน)` };

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'ระดับสิทธิ์การดูแล (SLA Tier)',
      value: <IndustryStatusDot tone={slaDisplay.tone} label={slaDisplay.label} />,
    },
    { label: 'ทีมดูแลหลัก (Assigned Queue)', value: profile.assignedQueue },
    { label: 'ช่องทางติดต่อหลัก', value: profile.preferredChannel },
    { label: 'ภาษาสำหรับรับบริการ', value: LANGUAGE_OPTIONS[profile.preferredLanguage] },
    {
      label: 'เลขอ้างอิงสัญญา / สมาชิก',
      value: <span className="font-mono">{profile.contractRef || '—'}</span>,
    },
    { label: 'ช่วงเวลาที่สะดวกให้โทรกลับ', value: profile.callbackWindow || 'ตลอดเวลาทำการ' },
    {
      label: 'คะแนนประเมินล่าสุด (CSAT)',
      value: <IndustryStatusDot tone={csatDisplay.tone} label={csatDisplay.label} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            ข้อมูลผู้ติดต่อ & มาตรฐาน SLA (Contact Center Profile)
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            ค่าในแท็บนี้จะถูกดึงไปแทนตัวแปร <code className="font-mono text-brand">{'{sla_tier}'}</code>,{' '}
            <code className="font-mono text-brand">{'{sla_time}'}</code>,{' '}
            <code className="font-mono text-brand">{'{assigned_team}'}</code> และ{' '}
            <code className="font-mono text-brand">{'{contract_ref}'}</code> ในแชทอัตโนมัติ
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`${secondaryButtonClass} flex items-center gap-1 shrink-0`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>แก้ไข</span>
        </button>
      </div>

      <div>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between py-2 text-xs border-b border-divider last:border-0"
          >
            <span className="text-text-secondary">{r.label}</span>
            <span className="font-semibold text-text-primary text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
