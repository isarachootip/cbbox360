import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { ChannelType, ChatMessage, Customer } from '../../types';
import { TierBadge } from './TierBadge';
import { GradeBadge } from './GradeBadge';
import { ClickToCallButton } from './ClickToCallButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCustomer } from '../../context/CustomerContext';
import { AiSummaryCard } from '../inbox/AiSummaryCard';
import { CustomerSideCardFooter } from './CustomerSideCardFooter';
import { SideCardCustomFieldsBlock } from './SideCardCustomFieldsBlock';
import { SideCardActiveActivity } from './SideCardActiveActivity';
import { NewTicketModal, NewTicketPayload } from '../service/NewTicketModal';
import { useLabel } from '../../../core/client/hooks/useLabel';
import { useEntitlement } from '../../../core/client/hooks/useEntitlement';
import { useContactCustomFields } from '../../../core/client/hooks/useContactCustomFields';
import { ExtensionSlot } from '../../../core/client/registry/ExtensionSlot';

interface CustomerSideCardProps {
  customer: Customer;
  conversationId?: string;
  channel?: ChannelType;
  messages?: ChatMessage[];
  onOpenTask?: () => void;
}

export const CustomerSideCard: React.FC<CustomerSideCardProps> = ({
  customer,
  conversationId,
  channel = 'LINE',
  messages = [],
  onOpenTask,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { customers, deals, tickets, addTicket } = useCustomer();
  const { contactLabel } = useLabel();
  const { isEntitled } = useEntitlement();
  const cf = useContactCustomFields(customer.id);
  const showCommercialStats = isEntitled('module:credit-sales');

  const [labels, setLabels] = useState<string[]>([]);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);

  const activeDeal = showCommercialStats
    ? deals.find((d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
    : undefined;
  const activeTicket = tickets.find((t) => t.customerId === customer.id && t.status !== 'Closed' && t.status !== 'Resolved');
  const lastCustomerMsg = [...messages].reverse().find((m) => m.sender === 'customer')?.text || '';

  const handleCreateCase = (payload: NewTicketPayload) => {
    addTicket({
      ...payload,
      slaHoursLeft: payload.priority === 'Critical' ? 2 : payload.priority === 'High' ? 4 : 8,
      slaStatus: payload.priority === 'Critical' ? 'warning' : 'normal',
      slaTargetNote: `${payload.priority}: ${payload.slaFormatted}`,
    });
    showToast(`เปิด Case จากแชทสำหรับ ${customer.name} เรียบร้อยแล้ว`, 'success');
    setIsCreateCaseOpen(false);
  };

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

      <SideCardActiveActivity activeDeal={activeDeal} activeTicket={activeTicket} />

      <CustomerSideCardFooter
        customerId={customer.id}
        labels={labels}
        onAddLabel={handleAddLabel}
        onOpenTask={onOpenTask}
        onOpenCreateCase={() => setIsCreateCaseOpen(true)}
      />

      <NewTicketModal
        isOpen={isCreateCaseOpen}
        customers={customers}
        initialCustomerId={customer.id}
        initialChannel={channel}
        initialTitle={lastCustomerMsg.slice(0, 120)}
        conversationId={conversationId}
        defaultAssignee={currentUser?.name || 'ทีม Helpdesk'}
        onClose={() => setIsCreateCaseOpen(false)}
        onCreate={handleCreateCase}
      />
    </div>
  );
};
