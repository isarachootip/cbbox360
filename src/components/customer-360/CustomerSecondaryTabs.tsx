import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Ticket } from '../../types';
import { GradeBadge } from '../common/GradeBadge';
import { StatusBadge } from '../common/StatusBadge';

interface CustomerSecondaryTabsProps {
  activeTab: 'Orders' | 'Service' | 'Credit' | 'Segments';
  customer: Customer;
  tickets: Ticket[];
}

export const CustomerSecondaryTabs: React.FC<CustomerSecondaryTabsProps> = ({
  activeTab,
  customer,
  tickets,
}) => {
  const navigate = useNavigate();

  if (activeTab === 'Orders') {
    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px] text-left">
          <thead className="bg-bg-muted text-text-secondary border-b border-border text-xs uppercase select-none">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">Order ID</th>
              <th className="px-3.5 py-2.5 font-semibold">วันที่</th>
              <th className="px-3.5 py-2.5 font-semibold">รายการ</th>
              <th className="px-3.5 py-2.5 font-semibold">ช่องทาง</th>
              <th className="px-3.5 py-2.5 font-semibold text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {[
              { id: 'SO-10482', date: '14 ก.ย. 2026', item: 'หมึกพิมพ์แท้ x 6 ชุด', ch: 'Sales rep', total: '฿8,950' },
              { id: 'SO-10398', date: '28 ส.ค. 2026', item: 'กระดาษการ์ดพิมพ์ A3 x 20 รีม', ch: 'LINE', total: '฿14,200' },
              { id: 'SO-10320', date: '10 ส.ค. 2026', item: 'หัวพิมพ์สำรอง + ล้างหัวพิมพ์', ch: '3CX', total: '฿22,500' },
            ].map((o) => (
              <tr key={o.id} className="hover:bg-bg-subtle">
                <td className="px-3.5 py-3 font-mono font-bold text-brand text-xs">{o.id}</td>
                <td className="px-3.5 py-3 text-text-secondary text-xs">{o.date}</td>
                <td className="px-3.5 py-3 text-text-primary font-medium">{o.item}</td>
                <td className="px-3.5 py-3 font-mono text-xs text-text-secondary">{o.ch}</td>
                <td className="px-3.5 py-3 text-right font-mono tabular-nums font-bold">{o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'Service') {
    return (
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
        {tickets
          .filter((t) => t.customerId === customer.id)
          .map((t) => (
            <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-bg-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-brand">{t.id}</span>
                  <span className="font-semibold text-[14px] text-text-primary">{t.title}</span>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {t.category} · ช่องทาง {t.channel} · {t.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-3 select-none">
                <StatusBadge status={t.status} />
                <button
                  type="button"
                  onClick={() => navigate('/cases')}
                  className="text-xs text-brand font-semibold hover:underline"
                >
                  เปิดดู
                </button>
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (activeTab === 'Credit') {
    return (
      <div className="p-4 bg-bg-subtle rounded-xl border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary text-[14px]">
            ข้อมูลวงเงินสินเชื่อและการชำระเงิน
          </span>
          <GradeBadge grade={customer.creditGrade} />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <div className="text-text-secondary">วงเงินอนุมัติ</div>
            <div className="text-base font-bold font-mono tabular-nums text-text-primary mt-0.5">
              ฿{customer.creditLimit.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-text-secondary">ยอดใช้ไป</div>
            <div className="text-base font-bold font-mono tabular-nums text-brand mt-0.5">
              ฿{customer.creditUsed.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-text-secondary">ยอดเกินกำหนด</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-600 mt-0.5">
              ฿{customer.creditOverdue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {customer.segments.map((seg, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl border border-border bg-bg-subtle flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-[13.5px] text-text-primary">{seg}</div>
            <div className="text-xs text-text-secondary mt-0.5">Dynamic CDP Cohort</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/segments')}
            className="text-xs text-brand font-semibold hover:underline select-none"
          >
            เปิดเงื่อนไข
          </button>
        </div>
      ))}
    </div>
  );
};
