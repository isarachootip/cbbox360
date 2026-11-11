import React from 'react';
import { Check, X, Phone, Mail, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { Customer } from '../../types';
import { TierBadge } from '../common/TierBadge';
import { GradeBadge } from '../common/GradeBadge';
import { ProgressBar } from '../common/ProgressBar';

interface CustomerProfileCardProps {
  customer: Customer;
}

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({ customer }) => {
  return (
    <div className="bg-white rounded-card border border-border p-5 flex flex-col gap-4 shadow-card">
      {/* Top Identity */}
      <div className="flex items-start gap-3.5">
        <div className="w-14 h-14 rounded-full bg-brand-tint text-brand-deep font-bold text-lg flex items-center justify-center flex-shrink-0 select-none">
          {customer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-text-primary leading-snug truncate">
            {customer.name}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-brand-deep bg-brand-tint/70 px-2 py-0.5 rounded-md">
              {customer.id}
            </span>
            <TierBadge tier={customer.tier} size="sm" />
            <GradeBadge grade={customer.creditGrade} size="sm" />
            {customer.customerType === 'CORPORATE' ? (
              <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>องค์กร (B2B)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>บุคคล (B2C)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Segment Badges */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {customer.segments.map((seg, idx) => (
          <span
            key={idx}
            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-muted text-sidebar-text border border-border"
          >
            {seg}
          </span>
        ))}
      </div>

      {/* 2x2 Stat Tiles */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        <div className="bg-bg-subtle rounded-xl p-3 border border-border/80">
          <div className="text-xs text-text-secondary font-medium">Lifetime Value</div>
          <div className="text-[15px] font-bold font-mono tabular-nums text-text-primary mt-0.5">
            ฿{customer.lifetimeValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-bg-subtle rounded-xl p-3 border border-border/80">
          <div className="text-xs text-text-secondary font-medium">ยอด 12 เดือน</div>
          <div className="text-[15px] font-bold font-mono tabular-nums text-text-primary mt-0.5">
            ฿{customer.spend12Months.toLocaleString()}
          </div>
        </div>
        <div className="bg-bg-subtle rounded-xl p-3 border border-border/80">
          <div className="text-xs text-text-secondary font-medium">Order 12 เดือน</div>
          <div className="text-[15px] font-bold font-mono tabular-nums text-text-primary mt-0.5">
            {customer.orders12Months}
          </div>
        </div>
        <div className="bg-bg-subtle rounded-xl p-3 border border-border/80">
          <div className="text-xs text-text-secondary font-medium">ซื้อล่าสุด</div>
          <div className="text-[14px] font-bold text-text-primary mt-0.5">
            <span className="font-mono tabular-nums">{customer.lastOrderDaysAgo}</span> วันก่อน
          </div>
        </div>
      </div>

      {/* Tier Retention Progress */}
      <div className="p-3.5 bg-tier-platinum-bg/40 border border-tier-platinum-accent/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">
            คงระดับ {customer.tier} ถึง {customer.tierValidUntil}
          </span>
          <span className="font-mono tabular-nums font-bold text-brand-deep">
            {customer.tierProgressPercent}%
          </span>
        </div>
        <ProgressBar value={customer.tierProgressPercent} max={100} color="brand" height="sm" />
        <div className="text-xs text-text-secondary">
          เกณฑ์คงระดับ <span className="font-mono tabular-nums">฿{customer.tierTargetSpend.toLocaleString()}</span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-t border-divider pt-3.5 space-y-2.5 text-[13px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-text-secondary" />
            <span>มือถือ</span>
          </span>
          <span className="font-mono tabular-nums text-text-primary font-medium">
            {customer.phone}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-text-secondary" />
            <span>อีเมล</span>
          </span>
          <span className="text-text-primary font-medium truncate max-w-[185px]">
            {customer.email}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary">ช่องทางเชื่อมต่อ</span>
          <div className="flex items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1 text-[#0B6B34] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06A94A]" />
              LINE
            </span>
            <span className="inline-flex items-center gap-1 text-[#1146A8] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0866FF]" />
              Facebook
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
            <span>วันเกิด</span>
          </span>
          <span className="text-text-primary font-medium">{customer.birthday}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span>ลูกค้าตั้งแต่</span>
          </span>
          <span className="text-text-primary font-medium">{customer.customerSince}</span>
        </div>
      </div>

      {/* Consent (PDPA) */}
      <div className="border-t border-divider pt-3.5 space-y-2 select-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Consent (PDPA)</span>
        </div>
        <div className="flex flex-wrap gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            LINE <Check className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            Email <Check className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-rose-600">
            SMS <X className="w-3.5 h-3.5 text-rose-500" />
          </span>
        </div>
      </div>
    </div>
  );
};
