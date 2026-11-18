import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { GradeBadge } from '../../../src/components/common/GradeBadge';
import { ProgressBar } from '../../../src/components/common/ProgressBar';
import { CreditTaskConfirmModal } from '../../../src/components/customer-360/CreditTaskConfirmModal';
import { useCustomer } from '../../../src/context/CustomerContext';
import { useToast } from '../../../src/context/ToastContext';
import type { ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

/**
 * Contributes the B2B Credit Limit Summary & Next Best Action card to `contact.right_rail.cards`.
 * Rendered ONLY when the active tenant has `module:credit-sales` enabled.
 */
export const CreditRightRailCard: React.FC<ModuleSlotProps> = ({ contactId }) => {
  const { customers, selectedCustomer, addTicket } = useCustomer();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customer =
    customers.find((c) => c.id.toLowerCase() === (contactId || '').toLowerCase()) ||
    selectedCustomer;

  if (!customer || !customer.creditLimit) return null;

  const creditPercent = Math.round((customer.creditUsed / customer.creditLimit) * 100);

  const handleConfirmTask = () => {
    addTicket({
      customerId: customer.id,
      customerName: customer.name,
      customerTier: customer.tier,
      title: `เสนอเพิ่มวงเงินเครดิตเป็น ฿400,000 (${customer.name})`,
      category: 'Credit',
      channel: 'LINE',
      status: 'Open',
      slaHoursLeft: 24,
      slaFormatted: '1 วัน',
      slaStatus: 'normal',
      assignee: 'ประเทือง ว.',
    });
    showToast('สร้าง Task ให้ทีมสินเชื่อเรียบร้อยแล้ว (อัปเดตใน Service & Case)', 'success');
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-card border border-border p-4 shadow-card">
        <div className="flex items-center justify-between pb-2.5 border-b border-divider">
          <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
            วงเงินเครดิต
          </span>
          <GradeBadge grade={customer.creditGrade} size="sm" />
        </div>

        <div className="pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">วงเงินอนุมัติ</span>
            <span className="font-mono tabular-nums font-bold text-text-primary">
              ฿{customer.creditLimit.toLocaleString()}
            </span>
          </div>
          <ProgressBar value={creditPercent} max={100} color="brand" height="sm" />
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              ใช้ไป <span className="font-mono tabular-nums font-medium">{creditPercent}%</span>
            </span>
            <span className="text-emerald-700 font-semibold font-mono tabular-nums">
              ค้างชำระ ฿{customer.creditOverdue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-warn-bg border border-warn-border rounded-card p-4 text-warn-text shadow-card space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.04em]">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Next Best Action</span>
        </div>
        <p className="text-[13px] text-[#5C3D00] leading-[1.6]">
          {customer.nextBestAction.description}
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 bg-white hover:bg-amber-50/80 border border-warn-border text-warn-text rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 select-none"
        >
          <span>{customer.nextBestAction.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <CreditTaskConfirmModal
        isOpen={isModalOpen}
        customer={customer}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmTask}
      />
    </>
  );
};
