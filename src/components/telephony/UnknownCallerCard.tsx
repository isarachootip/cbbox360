import React, { useState, useMemo } from 'react';
import { PhoneIncoming, UserPlus, Link2, Search } from 'lucide-react';
import type { CtiScreenPopQuery, Customer } from '../../types';
import { TierBadge } from '../common/TierBadge';

interface UnknownCallerCardProps {
  query: CtiScreenPopQuery;
  customers: Customer[];
  onOpenNewCustomer: () => void;
  onLinkExistingCustomer: (customer: Customer, contactName: string) => void;
}

export const UnknownCallerCard: React.FC<UnknownCallerCardProps> = ({
  query,
  customers,
  onOpenNewCustomer,
  onLinkExistingCustomer,
}) => {
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [contactLabel, setContactLabel] = useState('ผู้ติดต่อสายเรียกเข้า (3CX)');

  const filteredCustomers = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return customers.slice(0, 5);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.id.toLowerCase().includes(kw) ||
          (c.companyName && c.companyName.toLowerCase().includes(kw))
      )
      .slice(0, 5);
  }, [customers, searchKeyword]);

  return (
    <div className="bg-white border border-border rounded-card p-6 shadow-card max-w-2xl w-full mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-bg-subtle border border-border text-brand flex items-center justify-center flex-shrink-0">
            <PhoneIncoming className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>สายเรียกเข้าเบอร์ใหม่ · ยังไม่พบโปรไฟล์ใน CDP</span>
            </span>
            <h2 className="text-xl font-bold font-mono text-text-primary mt-0.5">
              {query.displayNumber}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3 bg-bg-subtle rounded-xl border border-border text-xs">
        <div>
          <span className="text-text-secondary block text-[11px]">หมายเลขต้นทาง</span>
          <span className="font-mono font-semibold text-text-primary">{query.rawNumber}</span>
        </div>
        <div>
          <span className="text-text-secondary block text-[11px]">Agent Extension</span>
          <span className="font-mono font-semibold text-text-primary">{query.ext || '—'}</span>
        </div>
        <div>
          <span className="text-text-secondary block text-[11px]">3CX Call ID</span>
          <span className="font-mono font-semibold text-text-primary truncate block">
            {query.callId || '—'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenNewCustomer}
          className="py-2.5 px-4 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>สร้างลูกค้าใหม่พร้อมเบอร์นี้ทันที</span>
        </button>
        <button
          type="button"
          onClick={() => setIsLinkingMode((prev) => !prev)}
          className="py-2.5 px-4 bg-white hover:bg-bg-subtle text-text-primary border border-border rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Link2 className="w-4 h-4 text-brand" />
          <span>ผูกเบอร์เข้ากับลูกค้าเดิม</span>
        </button>
      </div>

      {isLinkingMode && (
        <div className="pt-4 border-t border-divider space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                ค้นหาชื่อลูกค้า / รหัสลูกค้าเดิม
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="พิมพ์ชื่อ หรือ C00123..."
                  className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                ระบุชื่อผู้ติดต่อสำหรับเบอร์นี้
              </label>
              <input
                type="text"
                value={contactLabel}
                onChange={(e) => setContactLabel(e.target.value)}
                placeholder="เช่น คุณสมเกียรติ (ฝ่ายบัญชี)"
                className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="divide-y divide-divider border border-border rounded-lg overflow-hidden">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="p-2.5 bg-white hover:bg-bg-subtle flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary truncate">{cust.name}</span>
                    <span className="font-mono text-[11px] text-text-secondary">{cust.id}</span>
                    <TierBadge tier={cust.tier} />
                  </div>
                  <div className="font-mono text-[11px] text-text-secondary mt-0.5">
                    เบอร์หลักเดิม: {cust.fullPhone}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onLinkExistingCustomer(cust, contactLabel.trim() || 'ผู้ติดต่อ (3CX)')
                  }
                  className="px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded-md text-[11px] font-semibold flex-shrink-0 cursor-pointer"
                >
                  ผูกเบอร์ & เปิดโปรไฟล์
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
