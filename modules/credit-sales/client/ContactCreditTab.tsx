import React from 'react';
import { GradeBadge } from '../../../src/components/common/GradeBadge';
import { useCustomer } from '../../../src/context/CustomerContext';
import type { ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

export const ContactCreditTab: React.FC<ModuleSlotProps> = ({ contactId }) => {
  const { customers, selectedCustomer } = useCustomer();
  const customer =
    customers.find((c) => c.id.toLowerCase() === (contactId || '').toLowerCase()) ||
    selectedCustomer;

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
};
