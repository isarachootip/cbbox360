import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Customer, Deal, Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ExtensionSlot } from '../../../core/client/registry/ExtensionSlot';
import { useLabel } from '../../../core/client/hooks/useLabel';

interface CustomerRightSummaryColumnProps {
  customer: Customer;
  customerDeal: Deal;
  customerTicket: Ticket;
}

export const CustomerRightSummaryColumn: React.FC<CustomerRightSummaryColumnProps> = ({
  customer,
  customerDeal,
  customerTicket,
}) => {
  const navigate = useNavigate();
  const { caseLabel } = useLabel();

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

      {/* Case / Ticket Card */}
      <div className="bg-white rounded-card border border-border p-4 shadow-card">
        <div className="flex items-center justify-between pb-2.5 border-b border-divider select-none">
          <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
            {caseLabel} ล่าสุด
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

      {/* Pluggable Module Right-Rail Cards (e.g. Credit Sales, Policy Summary, Appointment Card) */}
      <ExtensionSlot name="contact.right_rail.cards" contactId={customer.id} />
    </div>
  );
};
