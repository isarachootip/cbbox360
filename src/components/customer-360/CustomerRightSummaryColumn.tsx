import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Customer, Deal, Ticket } from '../../types';
import { GradeBadge } from '../common/GradeBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressBar } from '../common/ProgressBar';

interface CustomerRightSummaryColumnProps {
  customer: Customer;
  customerDeal: Deal;
  customerTicket: Ticket;
  onOpenCreditTaskModal: () => void;
}

export const CustomerRightSummaryColumn: React.FC<CustomerRightSummaryColumnProps> = ({
  customer,
  customerDeal,
  customerTicket,
  onOpenCreditTaskModal,
}) => {
  const navigate = useNavigate();
  const creditPercent = Math.round((customer.creditUsed / customer.creditLimit) * 100);

  return (
    <div className="flex flex-col gap-3.5 lg:col-span-2 xl:col-span-1">
      {/* Deal Card */}
      <div className="bg-white rounded-card border border-border p-4 shadow-card">
        <div className="flex items-center justify-between pb-2.5 border-b border-divider select-none">
          <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
            Deal เปิดอยู่
          </span>
          <button
            type="button"
            onClick={() => navigate('/pipeline')}
            className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1"
          >
            <span>Sales Pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="pt-3">
          <div className="font-semibold text-[13.5px] text-text-primary">
            {customerDeal.title}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-text-secondary font-medium">
              {customerDeal.stage} · {customerDeal.probability}%
            </span>
            <span className="font-mono tabular-nums font-bold text-text-primary text-[14px]">
              ฿{customerDeal.value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Card */}
      <div className="bg-white rounded-card border border-border p-4 shadow-card">
        <div className="flex items-center justify-between pb-2.5 border-b border-divider select-none">
          <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
            Ticket ล่าสุด
          </span>
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1"
          >
            <span>Service</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="pt-3">
          <div className="font-semibold text-[13.5px] text-text-primary">
            <span className="font-mono text-brand text-xs mr-1.5">{customerTicket.id}</span>
            <span>{customerTicket.title}</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs">
            <StatusBadge status={customerTicket.status} />
            <span className="font-mono tabular-nums text-amber-700 font-semibold">
              SLA เหลือ {customerTicket.slaFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Credit Summary Card */}
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

      {/* Next Best Action */}
      <div className="bg-warn-bg border border-warn-border rounded-card p-4 text-warn-text shadow-card space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.04em]">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Next Best Action</span>
        </div>

        <p className="text-[13px] text-[#5C3D00] leading-[1.6]">
          {customer.nextBestAction.description}
        </p>

        <div className="flex items-center justify-between pt-0.5 text-xs">
          <span>
            Churn risk:{' '}
            <strong className="font-semibold text-emerald-700">{customer.churnRisk}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCreditTaskModal}
          className="w-full py-2 bg-white hover:bg-amber-50/80 border border-warn-border text-warn-text rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 select-none"
        >
          <span>{customer.nextBestAction.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
