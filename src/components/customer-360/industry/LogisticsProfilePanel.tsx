import React, { useState } from 'react';
import { Pencil, Truck } from 'lucide-react';
import { LogisticsProfile } from '../../../types/industryProfile';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { LogisticsProfileForm, SERVICE_LABELS } from './LogisticsProfileForm';
import { IndustryStatusDot } from './IndustryStatusDot';
import { primaryButtonClass, secondaryButtonClass } from './FormErrorList';

interface LogisticsProfilePanelProps {
  profile: LogisticsProfile | null;
  onSave: UseIndustryProfileResult['save'];
}

export const LogisticsProfilePanel: React.FC<LogisticsProfilePanelProps> = ({ profile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <LogisticsProfileForm initial={profile} onSave={onSave} onDone={() => setIsEditing(false)} />;
  }

  if (!profile) {
    return (
      <div className="py-10 text-center space-y-3">
        <Truck className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs text-text-secondary">ยังไม่มีข้อมูลบัญชีผู้ส่งสำหรับลูกค้ารายนี้</p>
        <button type="button" onClick={() => setIsEditing(true)} className={primaryButtonClass}>
          สร้างบัญชีผู้ส่ง
        </button>
      </div>
    );
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'รหัสบัญชีผู้ส่ง', value: profile.accountCode },
    { label: 'สาขาต้นทาง', value: profile.originBranch },
    { label: 'บริการที่ใช้ประจำ', value: SERVICE_LABELS[profile.defaultService] },
    {
      label: 'COD',
      value: profile.codEnabled ? (
        <IndustryStatusDot tone="emerald" label={`เปิดใช้ · ${profile.codBankAccount ?? ''}`} />
      ) : (
        <IndustryStatusDot tone="slate" label="ไม่ใช้" />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">บัญชีผู้ส่ง (Shipper Account)</h3>
        <button type="button" onClick={() => setIsEditing(true)} className={`${secondaryButtonClass} flex items-center gap-1`}>
          <Pencil className="w-3.5 h-3.5" />
          <span>แก้ไข</span>
        </button>
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between py-1.5 text-xs border-b border-divider last:border-0">
            <span className="text-text-secondary">{r.label}</span>
            <span className="font-semibold text-text-primary">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-text-primary">เลขพัสดุล่าสุด</h4>
        {profile.recentTrackingNumbers.length === 0 && <p className="text-xs text-text-muted">ยังไม่มีพัสดุ</p>}
        <div className="flex flex-wrap gap-2">
          {profile.recentTrackingNumbers.map((t) => (
            <span key={t} className="px-2 py-1 rounded-md border border-border font-mono text-[11px] text-text-primary">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
