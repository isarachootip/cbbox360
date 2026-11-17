import React from 'react';
import { Lock, Unlock, ShieldCheck } from 'lucide-react';
import { BusinessTemplatePreset, DeploymentMode } from '../../types';

interface BusinessModeLockCardProps {
  activeTemplate: BusinessTemplatePreset;
  deploymentMode: DeploymentMode;
  isSysAdmin: boolean;
  onChangeMode: (mode: DeploymentMode) => void;
}

export const BusinessModeLockCard: React.FC<BusinessModeLockCardProps> = ({
  activeTemplate,
  deploymentMode,
  isSysAdmin,
  onChangeMode,
}) => {
  const isLocked = deploymentMode === 'production_locked';

  return (
    <div className="p-5 rounded-xl border border-border bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-bold text-text-primary">
              โหมดการติดตั้งธุรกิจ: {activeTemplate.name} ({activeTemplate.thaiTitle})
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              isLocked ? 'text-emerald-600' : 'text-blue-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLocked ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
              }`}
            />
            <span>
              {isLocked
                ? 'ล็อกใช้งานจริงแล้ว (Production Single-Business)'
                : 'โหมดสาธิตหลายธุรกิจ (Demo Switcher Active)'}
            </span>
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {isLocked
            ? 'ระบบถูกล็อกให้ทำงานเฉพาะธุรกิจนี้เท่านั้น ตัวสลับธุรกิจบน Sidebar ถูกซ่อนทั้งหมดเพื่อป้องกันพนักงานกดเปลี่ยนโดยไม่ตั้งใจ'
            : 'กำลังเปิดแถบสลับธุรกิจด่วนบน Sidebar สำหรับพรีเซนต์หลายธุรกิจ เมื่อเปลี่ยนธุรกิจ ชุดข้อความตอบกลับ, Keyword บอท, คลังความรู้ AI และเมนูจะสลับตามทันทีโดยไม่ปนกัน'}
        </p>
      </div>

      <div className="shrink-0">
        {isSysAdmin ? (
          isLocked ? (
            <button
              type="button"
              onClick={() => onChangeMode('demo')}
              className="px-3.5 py-2 rounded-lg border border-border hover:bg-slate-50 text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              <span>ปลดล็อกเป็นโหมด Demo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChangeMode('production_locked')}
              className="px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ล็อกธุรกิจนี้ใช้งานจริง (Set ครั้งเดียว)</span>
            </button>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>ตั้งค่าล็อกได้เฉพาะ sysadmin</span>
          </span>
        )}
      </div>
    </div>
  );
};
