import React from 'react';
import { ShieldCheck, MessageSquare, FileWarning, Clock } from 'lucide-react';
import type { ConsentKpiSummary } from '../../domain/consent/consentMetrics';

interface ConsentKpiRowProps {
  kpis: ConsentKpiSummary;
  activePolicyVersion: string;
}

export const ConsentKpiRow: React.FC<ConsentKpiRowProps> = ({
  kpis,
  activePolicyVersion,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
    <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium truncate">
          อัตราให้ความยินยอมการตลาด (Opt-in)
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-text-primary mt-0.5">
          {kpis.optInRatePercent}%{' '}
          <span className="text-xs font-sans font-normal text-text-muted">
            ({kpis.optInCount}/{kpis.totalCustomers} ราย · {activePolicyVersion})
          </span>
        </div>
      </div>
    </div>

    <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium truncate">
          ยินยอมรับข่าวสารผ่าน LINE OA
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-text-primary mt-0.5">
          {kpis.lineOptInCount}{' '}
          <span className="text-xs font-sans font-normal text-text-muted">
            ราย ({kpis.lineOptInPercent}% พร้อม Broadcast)
          </span>
        </div>
      </div>
    </div>

    <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium truncate">
          คำขอใช้สิทธิ์ (DSR) รอดำเนินการ
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-text-primary mt-0.5">
          {kpis.pendingDsrCount}{' '}
          <span className="text-xs font-sans font-normal text-text-muted">
            รายการ (กรอบกฎหมาย 30 วัน)
          </span>
        </div>
      </div>
    </div>

    <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <FileWarning className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium truncate">
          เร่งด่วน / เกินกำหนด SLA (≤ 5 วัน)
        </div>
        <div
          className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
            kpis.urgentSlaCount > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {kpis.urgentSlaCount}{' '}
          <span className="text-xs font-sans font-normal text-text-muted">รายการต้องติดตาม</span>
        </div>
      </div>
    </div>
  </div>
);
