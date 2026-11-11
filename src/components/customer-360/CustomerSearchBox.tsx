import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Customer } from '../../types';
import { TierBadge } from '../common/TierBadge';

interface CustomerSearchBoxProps {
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
}

export const CustomerSearchBox: React.FC<CustomerSearchBoxProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  return (
    <div className="relative w-full max-w-md">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        placeholder="ค้นหา ชื่อ · เบอร์โทร · Customer ID"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-bg-subtle border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
      />

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-modal z-50 max-h-64 overflow-y-auto custom-scrollbar">
          {results.length > 0 ? (
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCustomer(c.id);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="px-3.5 py-2.5 hover:bg-bg-subtle cursor-pointer flex items-center justify-between text-xs border-b border-divider last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-tint text-brand-deep font-bold flex items-center justify-center text-[11px]">
                    {c.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-text-primary">{c.name}</div>
                    <div className="text-[11px] text-text-secondary font-mono tabular-nums">
                      {c.id} · {c.phone}
                    </div>
                  </div>
                </div>
                <TierBadge tier={c.tier} size="sm" />
              </div>
            ))
          ) : (
            <div className="p-3 text-xs text-text-secondary text-center">ไม่พบข้อมูลลูกค้า</div>
          )}
        </div>
      )}
    </div>
  );
};
