import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Phone, UserX } from 'lucide-react';
import { Customer } from '../../types';
import { TierBadge } from '../common/TierBadge';
import { GradeBadge } from '../common/GradeBadge';

interface CustomerTableProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    navigate(`/customers/${customer.id}`);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-border rounded-card p-12 text-center select-none shadow-card">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <UserX className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">ไม่พบข้อมูลลูกค้า</h3>
        <p className="text-xs text-text-secondary">
          ลองปรับเงื่อนไขการค้นหา หรือตัวกรอง Tier / เกรดเครดิต
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-ui">
          <thead className="select-none">
            <tr className="border-b border-border bg-bg-muted text-text-secondary text-xs font-medium">
              <th className="py-3 px-4 font-medium">ลูกค้า / องค์กร</th>
              <th className="py-3 px-4 font-medium">ระดับ Tier</th>
              <th className="py-3 px-4 font-medium">เกรดเครดิต</th>
              <th className="py-3 px-4 font-medium text-right">ยอดซื้อสะสม (LTV)</th>
              <th className="py-3 px-4 font-medium text-right">ยอดซื้อ 12 เดือน</th>
              <th className="py-3 px-4 font-medium text-center">คำสั่งซื้อ</th>
              <th className="py-3 px-4 font-medium">กลุ่มลูกค้า (Segments)</th>
              <th className="py-3 px-4 font-medium text-center">ความเสี่ยงเลิกใช้</th>
              <th className="py-3 px-4 font-medium text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {customers.map((c) => {
              const churnDot =
                c.churnRisk === 'สูง'
                  ? 'bg-rose-500'
                  : c.churnRisk === 'ปานกลาง'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';
              const churnText =
                c.churnRisk === 'สูง'
                  ? 'text-rose-600'
                  : c.churnRisk === 'ปานกลาง'
                  ? 'text-amber-600'
                  : 'text-emerald-600';

              return (
                <tr
                  key={c.id}
                  onClick={() => handleRowClick(c)}
                  className="hover:bg-bg-subtle transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-tint text-brand-deep font-semibold flex items-center justify-center text-xs flex-shrink-0 select-none">
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-text-primary group-hover:text-brand transition-colors truncate flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.customerType === 'CORPORATE' && (
                            <span className="inline-flex items-center gap-1 text-2xs text-blue-600 font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span>องค์กร</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5 tabular-nums">
                          <span className="font-mono">{c.id}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 select-none">
                    <TierBadge tier={c.tier} size="sm" />
                  </td>

                  <td className="py-3 px-4 select-none">
                    <GradeBadge grade={c.creditGrade} />
                  </td>

                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-text-primary text-ui">
                    {formatCurrency(c.lifetimeValue)}
                  </td>

                  <td className="py-3 px-4 text-right text-text-secondary tabular-nums text-ui">
                    {formatCurrency(c.spend12Months)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="tabular-nums font-medium text-text-primary text-ui">
                      {c.orders12Months}
                    </span>
                    <span className="text-2xs text-text-muted block">รายการ</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[210px]">
                      {c.segments.slice(0, 2).map((seg, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-2xs bg-bg-muted text-slate-700 border border-border/70 font-normal"
                        >
                          {seg}
                        </span>
                      ))}
                      {c.segments.length > 2 && (
                        <span className="text-2xs text-text-muted tabular-nums self-center">
                          +{c.segments.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center select-none">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${churnText}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${churnDot}`} />
                      <span>{c.churnRisk}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right select-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(c);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand hover:text-brand-hover hover:bg-brand-tint rounded-lg transition-colors cursor-pointer"
                    >
                      <span>360°</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
