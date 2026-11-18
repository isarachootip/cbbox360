import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ChatMessage, Customer } from '../../types';
import { TierBadge } from './TierBadge';
import { GradeBadge } from './GradeBadge';
import { ClickToCallButton } from './ClickToCallButton';
import { useToast } from '../../context/ToastContext';
import { useCustomer } from '../../context/CustomerContext';
import { AiSummaryCard } from '../inbox/AiSummaryCard';
import { CustomerSideCardFooter } from './CustomerSideCardFooter';
import { SideCardCustomFieldsBlock } from './SideCardCustomFieldsBlock';
import { useLabel } from '../../../core/client/hooks/useLabel';
import { useEntitlement } from '../../../core/client/hooks/useEntitlement';
import { useContactCustomFields } from '../../../core/client/hooks/useContactCustomFields';
import { ExtensionSlot } from '../../../core/client/registry/ExtensionSlot';

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
  const { contactLabel } = useLabel();
  const { isEntitled } = useEntitlement();
  const cf = useContactCustomFields(customer.id);
  const showCommercialStats = isEntitled('module:credit-sales');

  const [labels, setLabels] = useState<string[]>([]);

  const activeDeal = showCommercialStats
    ? deals.find((d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
    : undefined;
  const activeTicket = tickets.find((t) => t.customerId === customer.id && t.status !== 'Closed');

  const handleAddLabel = (lbl: string) => {
    if (!labels.includes(lbl)) {
      setLabels((prev) => [...prev, lbl]);
      showToast(`เพิ่มป้ายกำกับ "${lbl}" สำเร็จ`, 'success');
    }
  };

  return (
    <div className="w-[324px] flex-shrink-0 bg-white border-l border-border h-full overflow-y-auto custom-scrollbar flex flex-col p-4 text-ui">
      <div className="flex items-center justify-between pb-3 border-b border-divider select-none">
        <span className="text-2xs font-semibold text-text-muted tracking-[0.05em] uppercase">
          ข้อมูล{contactLabel}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/customers/${customer.id}`)}
          className="text-brand hover:text-brand-hover text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          <span>{contactLabel} 360</span>
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
        <div className="w-11 h-11 rounded-full bg-brand-tint text-brand-deep font-semibold flex items-center justify-center text-sm select-none">
          {customer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-text-primary truncate">{customer.name}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="font-mono text-2xs text-brand-deep font-medium">
              {typeof cf.values.hn === 'string' && cf.values.hn ? cf.values.hn : customer.id}
            </span>
            <TierBadge tier={customer.tier} size="sm" />
            {showCommercialStats && <GradeBadge grade={customer.creditGrade} size="sm" />}
          </div>
        </div>
      </div>

      <div className="space-y-2 py-3 border-y border-divider text-ui">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">มือถือ</span>
          <ClickToCallButton
            phone={customer.phone}
            fullPhone={customer.fullPhone}
            customerId={customer.id}
            customerName={customer.name}
          />
        </div>
        {showCommercialStats && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">ยอด 12 เดือน</span>
              <span className="tabular-nums font-semibold text-text-primary">
                ฿{customer.spend12Months.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">ซื้อล่าสุด</span>
              <span className="text-text-primary tabular-nums text-xs">
                <span className="font-mono">{customer.lastOrderCode}</span> · {customer.lastOrderDaysAgo} วันก่อน
              </span>
            </div>
          </>
        )}
      </div>

      <SideCardCustomFieldsBlock
        contactLabel={contactLabel}
        definitions={cf.definitions}
        values={cf.values}
        redactedFlags={cf.redactedFlags}
        banners={cf.banners}
        canEditField={cf.canEditField}
        onSave={async (next) => {
          const res = await cf.saveValues(next);
          if (res.ok) showToast(`บันทึกข้อมูล${contactLabel}สำเร็จ`, 'success');
          return res;
        }}
      />

      <div className="py-2.5 border-b border-divider empty:hidden">
        <ExtensionSlot name="contact.right_rail.cards" contactId={customer.id} />
      </div>

      {(activeDeal || activeTicket) && (
        <div className="py-3 border-b border-divider space-y-2">
          <div className="text-xs font-medium text-text-secondary">Activity ที่กำลังเปิดอยู่</div>
          {activeDeal && (
            <div
              onClick={() => navigate('/pipeline')}
              className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div>
                <div className="text-text-secondary text-xs">Deal · {activeDeal.title}</div>
                <div className="tabular-nums font-semibold text-text-primary mt-0.5">
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
                <div className="text-text-secondary text-xs">
                  Case <span className="font-mono font-medium">{activeTicket.id}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 font-medium text-amber-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="tabular-nums">SLA เหลือ {activeTicket.slaFormatted}</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
            </div>
          )}
        </div>
      )}

      <CustomerSideCardFooter
        customerId={customer.id}
        labels={labels}
        onAddLabel={handleAddLabel}
        onOpenTask={onOpenTask}
      />
    </div>
  );
};
