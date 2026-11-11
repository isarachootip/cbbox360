import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ChatMessage, Customer } from '../../types';
import { TierBadge } from './TierBadge';
import { GradeBadge } from './GradeBadge';
import { useToast } from '../../context/ToastContext';
import { useCustomer } from '../../context/CustomerContext';
import { AiSummaryCard } from '../inbox/AiSummaryCard';
import { CustomerSideCardFooter } from './CustomerSideCardFooter';

interface CustomerSideCardProps {
  customer: Customer;
  conversationId?: string;
  messages?: ChatMessage[];
  onOpenTask?: () => void;
}

export const CustomerSideCard: React.FC<CustomerSideCardProps> = ({
  customer,
  conversationId,
  messages = [],
  onOpenTask,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { deals, tickets } = useCustomer();
  const [labels, setLabels] = useState<string[]>(['จัดส่ง', 'ลูกค้าองค์กร']);

  const activeDeal = deals.find(
    (d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const activeTicket = tickets.find(
    (t) => t.customerId === customer.id && t.status !== 'Closed'
  );

  const handleAddLabel = (lbl: string) => {
    if (!labels.includes(lbl)) {
      setLabels((prev) => [...prev, lbl]);
      showToast(`เพิ่มป้ายกำกับ "${lbl}" สำเร็จ`, 'success');
    }
  };

  return (
    <div className="w-[324px] flex-shrink-0 bg-white border-l border-border h-full overflow-y-auto custom-scrollbar flex flex-col p-4 text-[13px]">
      <div className="flex items-center justify-between pb-3 border-b border-divider select-none">
        <span className="text-[11px] font-semibold text-text-secondary tracking-[0.06em] uppercase">
          CDP Context
        </span>
        <button
          type="button"
          onClick={() => navigate(`/customers/${customer.id}`)}
          className="text-brand hover:text-brand-hover text-xs font-semibold flex items-center gap-1"
        >
          <span>Customer 360</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {conversationId && (
        <div className="pt-3">
          <AiSummaryCard
            conversationId={conversationId}
            customer={customer}
            messages={messages}
            onAddSuggestedLabel={handleAddLabel}
          />
        </div>
      )}

      <div className="py-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-brand-tint text-brand-deep font-bold flex items-center justify-center text-sm select-none">
          {customer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-text-primary truncate">{customer.name}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-[11px] text-brand-deep font-semibold">{customer.id}</span>
            <TierBadge tier={customer.tier} size="sm" />
            <GradeBadge grade={customer.creditGrade} size="sm" />
          </div>
        </div>
      </div>

      <div className="space-y-2 py-3 border-y border-divider text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">มือถือ</span>
          <span className="font-mono tabular-nums text-text-primary font-medium">{customer.phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">ยอด 12 เดือน</span>
          <span className="font-mono tabular-nums font-semibold text-text-primary">
            ฿{customer.spend12Months.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">ซื้อล่าสุด</span>
          <span className="text-text-primary font-mono tabular-nums text-xs">
            {customer.lastOrderCode} · {customer.lastOrderDaysAgo} วันก่อน
          </span>
        </div>
      </div>

      <div className="py-3 border-b border-divider">
        <div className="text-[11px] font-semibold text-text-secondary tracking-[0.06em] uppercase mb-2">
          Segments
        </div>
        <div className="flex flex-wrap gap-1.5">
          {customer.segments.map((seg, idx) => (
            <span
              key={idx}
              className="text-xs bg-bg-muted text-sidebar-text border border-border px-2.5 py-0.5 rounded-full font-medium"
            >
              {seg}
            </span>
          ))}
        </div>
      </div>

      <div className="py-3 border-b border-divider space-y-2">
        <div className="text-[11px] font-semibold text-text-secondary tracking-[0.06em] uppercase">
          Activity เปิดอยู่
        </div>
        {activeDeal && (
          <div
            onClick={() => navigate('/pipeline')}
            className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
          >
            <div>
              <div className="text-text-secondary text-xs">Deal · {activeDeal.title}</div>
              <div className="font-mono tabular-nums font-bold text-text-primary mt-0.5">
                ฿{activeDeal.value.toLocaleString()}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        )}
        {activeTicket && (
          <div
            onClick={() => navigate('/cases')}
            className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-mono text-text-secondary text-xs">Ticket {activeTicket.id}</div>
              <div className="inline-flex items-center gap-1.5 font-semibold text-amber-600 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>SLA เหลือ {activeTicket.slaFormatted}</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        )}
      </div>

      <CustomerSideCardFooter
        customerId={customer.id}
        labels={labels}
        onAddLabel={handleAddLabel}
        onOpenTask={onOpenTask}
      />
    </div>
  );
};
