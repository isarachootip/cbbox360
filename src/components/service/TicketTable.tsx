import React from 'react';
import { Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { TierBadge } from '../common/TierBadge';
import { getPriorityIndicator } from '../../domain/cases/caseMetrics';

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
        <table className="w-full text-ui text-left">
          <thead className="bg-bg-muted text-text-secondary border-b border-border text-xs select-none">
            <tr>
              <th className="px-4 py-3 font-medium">Case ID</th>
              <th className="px-4 py-3 font-medium">หัวข้อปัญหา / ระบบงาน</th>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">หมวด · ช่องทาง</th>
              <th className="px-4 py-3 font-medium">ความเร่งด่วน</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-secondary">
                  ไม่พบรายการ Case ตามตัวกรองที่เลือก
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const prio = getPriorityIndicator(t.priority);
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-semibold text-xs tabular-nums text-brand">
                        {t.id}
                      </div>
                      {t.externalTicketId && (
                        <div className="font-mono text-[11px] text-text-secondary mt-0.5">
                          Ref: {t.externalTicketId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-medium text-sm text-text-primary truncate">{t.title}</div>
                      {t.systemName && (
                        <div className="text-xs text-text-secondary truncate mt-0.5">
                          ระบบ: {t.systemName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-text-body2 font-normal">{t.customerName}</span>
                        <TierBadge tier={t.customerTier} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      <span className="font-medium text-text-body2">{t.category}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>{t.channel}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap select-none">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${prio.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                        <span>{prio.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap select-none">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs whitespace-nowrap">
                      <span
                        className={
                          t.slaStatus === 'danger'
                            ? 'text-rose-600 font-semibold'
                            : t.slaStatus === 'warning'
                            ? 'text-amber-600 font-medium'
                            : 'text-text-secondary font-normal'
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
