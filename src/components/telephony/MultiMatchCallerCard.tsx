import React from 'react';
import { PhoneCall, ArrowRight } from 'lucide-react';
import type { CtiScreenPopQuery, CustomerPhoneMatch } from '../../types';
import { TierBadge } from '../common/TierBadge';

interface MultiMatchCallerCardProps {
  query: CtiScreenPopQuery;
  matches: CustomerPhoneMatch[];
  onSelectMatch: (match: CustomerPhoneMatch) => void;
}

export const MultiMatchCallerCard: React.FC<MultiMatchCallerCardProps> = ({
  query,
  matches,
  onSelectMatch,
}) => {
  return (
    <div className="bg-white border border-border rounded-card p-6 shadow-card max-w-2xl w-full mx-auto space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-bg-subtle border border-border text-brand flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>พบโปรไฟล์ที่ตรงกับเบอร์โทร {matches.length} รายการ</span>
          </span>
          <h2 className="text-lg font-bold text-text-primary mt-0.5">
            กรุณาเลือกโปรไฟล์ลูกค้าสำหรับสาย{' '}
            <span className="font-mono text-brand">{query.displayNumber}</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-secondary font-mono bg-bg-subtle px-3.5 py-2 rounded-lg border border-border">
        <span>Ext: {query.ext || '—'}</span>
        <span>·</span>
        <span>Call ID: {query.callId || '—'}</span>
      </div>

      <div className="divide-y divide-divider border border-border rounded-xl overflow-hidden">
        {matches.map((match) => (
          <div
            key={match.customer.id}
            className="p-3.5 bg-white hover:bg-bg-subtle flex items-center justify-between gap-4 transition-colors"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-text-primary">{match.customer.name}</span>
                <span className="font-mono text-xs text-text-secondary">{match.customer.id}</span>
                <TierBadge tier={match.customer.tier} />
              </div>
              <div className="text-xs text-text-secondary">
                ตรงกับข้อมูล: <strong className="text-text-primary">{match.matchedLabel}</strong>{' '}
                <span className="font-mono">({match.matchedRawPhone})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectMatch(match)}
              className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-colors"
            >
              <span>เปิด Customer 360°</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
