import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Phone, Mail, UserX } from 'lucide-react';
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-12 text-center select-none shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <UserX className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">ไม่พบข้อมูลลูกค้า</h3>
        <p className="text-xs text-text-secondary">ลองปรับเงื่อนไขการค้นหา หรือตัวกรอง Tier / เกรดเครดิต</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden select-none">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-slate-50/70 text-text-secondary font-semibold">
              <th className="py-3 px-4">ลูกค้า / องค์กร</th>
              <th className="py-3 px-4">ระดับ Tier</th>
              <th className="py-3 px-4">เกรดเครดิต</th>
              <th className="py-3 px-4 text-right">ยอดซื้อสะสม (LTV)</th>
              <th className="py-3 px-4 text-right">ยอดซื้อ 12 เดือน</th>
              <th className="py-3 px-4 text-center">คำสั่งซื้อ</th>
              <th className="py-3 px-4">กลุ่มลูกค้า (Segments)</th>
              <th className="py-3 px-4 text-center">ความเสี่ยงเลิกใช้</th>
              <th className="py-3 px-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Customer Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-tint text-brand font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary group-hover:text-brand transition-colors truncate flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.customerType === 'CORPORATE' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span>องค์กร</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500">{c.id}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {c.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-3 px-4">
                    <TierBadge tier={c.tier} size="sm" />
                  </td>

                  {/* Credit Grade */}
                  <td className="py-3 px-4">
                    <GradeBadge grade={c.creditGrade} />
                  </td>

                  {/* LTV */}
                  <td className="py-3 px-4 text-right font-medium text-text-primary">
                    {formatCurrency(c.lifetimeValue)}
                  </td>

                  {/* 12M Spend */}
                  <td className="py-3 px-4 text-right text-text-secondary font-mono">
                    {formatCurrency(c.spend12Months)}
                  </td>

                  {/* Orders */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-text-primary">{c.orders12Months}</span>
                    <span className="text-[11px] text-text-secondary block">รายการ</span>
                  </td>

                  {/* Segments */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.segments.slice(0, 2).map((seg, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium"
                        >
                          {seg}
                        </span>
                      ))}
                      {c.segments.length > 2 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">
                          +{c.segments.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Churn Risk: CB360 Dot + Colored Text Standard */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${churnText}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${churnDot}`} />
                      <span>{c.churnRisk}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
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
