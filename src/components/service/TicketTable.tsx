import React from 'react';
import { Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { TierBadge } from '../common/TierBadge';

interface TicketTableProps {
  tickets: Ticket[];
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
}) => {
  return (
    <div className="bg-white rounded-card border border-border overflow-hidden shadow-card flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-[13.5px] text-left">
          <thead className="bg-bg-muted text-text-secondary border-b border-border text-xs uppercase tracking-[0.04em] select-none">
            <tr>
              <th className="px-4 py-3 font-semibold">Ticket ID</th>
              <th className="px-4 py-3 font-semibold">หัวข้อปัญหา / คำร้อง</th>
              <th className="px-4 py-3 font-semibold">ลูกค้า</th>
              <th className="px-4 py-3 font-semibold">หมวด · ช่องทาง</th>
              <th className="px-4 py-3 font-semibold">สถานะ</th>
              <th className="px-4 py-3 font-semibold text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-secondary">
                  ไม่พบรายการ Ticket ตามตัวกรองที่เลือก
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-selected border-l-[3px] border-brand'
                        : 'hover:bg-bg-subtle border-l-[3px] border-transparent'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-xs tabular-nums text-brand whitespace-nowrap">
                      {t.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[14px] text-text-primary max-w-[280px] truncate">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-medium">{t.customerName}</span>
                        <TierBadge tier={t.customerTier} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      <span className="font-medium text-text-body2">{t.category}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-mono">{t.channel}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap select-none">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                      <span
                        className={
                          t.slaStatus === 'danger'
                            ? 'text-rose-600 font-bold'
                            : t.slaStatus === 'warning'
                            ? 'text-amber-600 font-semibold'
                            : 'text-text-primary font-medium'
                        }
                      >
                        {t.slaFormatted}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
