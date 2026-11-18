import React from 'react';
import type { ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

const SAMPLE_B2B_ORDERS = [
  { id: 'SO-10482', date: '14 ก.ย. 2026', item: 'หมึกพิมพ์แท้ x 6 ชุด', ch: 'Sales rep', total: '฿8,950' },
  { id: 'SO-10398', date: '28 ส.ค. 2026', item: 'กระดาษการ์ดพิมพ์ A3 x 20 รีม', ch: 'LINE', total: '฿14,200' },
  { id: 'SO-10320', date: '10 ส.ค. 2026', item: 'หัวพิมพ์สำรอง + ล้างหัวพิมพ์', ch: '3CX', total: '฿22,500' },
];

export const ContactOrdersTab: React.FC<ModuleSlotProps> = () => (
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
        {SAMPLE_B2B_ORDERS.map((o) => (
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
