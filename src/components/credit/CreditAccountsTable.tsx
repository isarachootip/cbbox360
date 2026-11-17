import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { CreditAccount, Customer } from '../../types';
import { GradeBadge } from '../common/GradeBadge';
import { ClickToCallButton } from '../common/ClickToCallButton';

interface CreditAccountsTableProps {
  accounts: CreditAccount[];
  customers: Customer[];
  onOpenCustomer: (customerId: string) => void;
  onViewOverdueSegment: () => void;
}

export const CreditAccountsTable: React.FC<CreditAccountsTableProps> = ({
  accounts,
  customers,
  onOpenCustomer,
  onViewOverdueSegment,
}) => {
  return (
    <div className="bg-white rounded-card border border-border overflow-hidden shadow-card flex-1 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-bold text-xs text-text-primary">
          บัญชีลูกค้าเครดิต · เรียงตามยอดเกินกำหนด
        </span>
        <button
          type="button"
          onClick={onViewOverdueSegment}
          className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>ดู Segment Overdue</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left">
          <thead className="bg-bg-muted text-text-secondary border-b border-border">
            <tr>
              <th className="px-3.5 py-2.5 font-medium">ลูกค้า</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Grade</th>
              <th className="px-3.5 py-2.5 font-medium text-right">วงเงิน</th>
              <th className="px-3.5 py-2.5 font-medium">ใช้ไป</th>
              <th className="px-3.5 py-2.5 font-medium text-right">เกินกำหนด</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Aging</th>
              <th className="px-3.5 py-2.5 font-medium">Next action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {accounts.map((acc) => {
              const isHighUsage = acc.usedPercent > 80;
              const isOverdue = acc.overdueAmount > 0;
              const matchedCustomer = customers.find((c) => c.id === acc.customerId);
              const agingColor =
                acc.aging === 'ปกติ'
                  ? { text: 'text-emerald-600', dot: 'bg-emerald-500' }
                  : acc.aging === '90+ วัน'
                  ? { text: 'text-rose-600', dot: 'bg-rose-500' }
                  : { text: 'text-amber-600', dot: 'bg-amber-500' };

              return (
                <tr
                  key={acc.id}
                  onClick={() => onOpenCustomer(acc.customerId)}
                  className="hover:bg-bg-subtle cursor-pointer transition-colors"
                >
                  <td className="px-3.5 py-2.5 font-semibold text-text-primary hover:text-brand">
                    {acc.customerName}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <GradeBadge grade={acc.grade} prefix="" size="sm" />
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-text-primary">
                    ฿{acc.limit.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>{acc.usedPercent}%</span>
                      </div>
                      <div className="w-full bg-divider h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isHighUsage ? 'bg-amber-500' : 'bg-brand'}`}
                          style={{ width: `${Math.min(100, acc.usedPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                    <span className={isOverdue ? 'text-rose-600' : 'text-emerald-700'}>
                      ฿{acc.overdueAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${agingColor.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${agingColor.dot}`} />
                      <span>{acc.aging}</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-text-body2">
                    <div className="flex items-center justify-between gap-2">
                      <span>{acc.nextAction}</span>
                      {matchedCustomer && (
                        <ClickToCallButton
                          phone={matchedCustomer.phone}
                          fullPhone={matchedCustomer.fullPhone}
                          customerId={matchedCustomer.id}
                          customerName={matchedCustomer.name}
                          variant={acc.nextAction.includes('โทร') ? 'button' : 'icon'}
                          label="โทรติดตาม"
                        />
                      )}
                    </div>
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
