import React from 'react';
import { Award, CalendarClock, DollarSign, Headphones, ShieldAlert, Users } from 'lucide-react';
import { Customer, Ticket } from '../../types';
import { TenantFieldDefinition } from '../../../core/client/providers/TenantRuntimeContext';
import { ContactCustomFieldSummary } from '../../../core/client/hooks/useContactListCustomFields';

interface CustomerKpiRowProps {
  customers: Customer[];
  tickets: Ticket[];
  contactLabel: string;
  caseLabel: string;
  isCommercialB2B: boolean;
  definitions: TenantFieldDefinition[];
  records: Record<string, ContactCustomFieldSummary>;
}

const hasNonEmptyField = (summary: ContactCustomFieldSummary | undefined, key: string): boolean => {
  if (!summary) return false;
  if (summary.redactedFlags?.[key]?.hasValue) return true;
  const raw = summary.values?.[key];
  if (Array.isArray(raw)) return raw.length > 0;
  return raw !== undefined && raw !== null && raw !== '';
};

export const CustomerKpiRow: React.FC<CustomerKpiRowProps> = ({
  customers,
  tickets,
  contactLabel,
  caseLabel,
  isCommercialB2B,
  definitions,
  records,
}) => {
  const vipCount = customers.filter((c) => c.tier === 'PLATINUM' || c.tier === 'GOLD').length;
  const totalLTV = customers.reduce((sum, c) => sum + c.lifetimeValue, 0);
  const openCasesCount = tickets.filter((t) => t.status !== 'Closed').length;

  const alertDef = definitions.find((d) => d.ui?.alertBanner?.whenNonEmpty);
  const dateDef = definitions.find((d) => d.type === 'date');

  const renderMiddleCard = () => {
    if (isCommercialB2B || (!alertDef && !dateDef)) {
      return (
        <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FBEBC8]/60 text-[#7A4F00] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary font-medium">กลุ่ม VIP (Gold / Platinum)</div>
            <div className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
              {vipCount} <span className="text-xs font-normal text-text-secondary">ราย</span>
            </div>
          </div>
        </div>
      );
    }

    if (alertDef) {
      const flagged = customers.filter((c) => hasNonEmptyField(records[c.id], alertDef.key)).length;
      return (
        <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary font-medium">เฝ้าระวัง · {alertDef.label}</div>
            <div className="text-xl font-bold text-rose-600 tabular-nums mt-0.5">
              {flagged} <span className="text-xs font-normal text-text-secondary">ราย</span>
            </div>
          </div>
        </div>
      );
    }

    const tracked = customers.filter((c) => hasNonEmptyField(records[c.id], dateDef!.key)).length;
    return (
      <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-text-secondary font-medium">ติดตาม · {dateDef!.label}</div>
          <div className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
            {tracked} <span className="text-xs font-normal text-text-secondary">รายการ</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-brand-tint text-brand flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-text-secondary font-medium">{contactLabel}ในระบบทั้งหมด</div>
          <div className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
            {customers.length} <span className="text-xs font-normal text-text-secondary">ราย</span>
          </div>
        </div>
      </div>

      {renderMiddleCard()}

      {isCommercialB2B ? (
        <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E3F7EA] text-[#0B6B34] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary font-medium">มูลค่าซื้อสะสมรวม (Total LTV)</div>
            <div className="text-xl font-bold text-text-primary font-mono tabular-nums mt-0.5">
              ฿{(totalLTV / 1_000_000).toFixed(2)}M
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E3F7EA] text-[#0B6B34] flex items-center justify-center flex-shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary font-medium">{caseLabel}ที่เปิดอยู่</div>
            <div className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
              {openCasesCount} <span className="text-xs font-normal text-text-secondary">รายการ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
