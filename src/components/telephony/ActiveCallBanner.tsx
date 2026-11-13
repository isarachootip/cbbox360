import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PhoneCall, CheckCircle2, Headphones, X } from 'lucide-react';
import type { Customer } from '../../types';
import { useTelephony } from '../../context/TelephonyContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { normalizeThaiPhone, formatThaiPhoneDisplay } from '../../domain/telephony/phoneMatcher';

interface ActiveCallBannerProps {
  customer: Customer;
  className?: string;
}

export const ActiveCallBanner: React.FC<ActiveCallBannerProps> = ({
  customer,
  className = '',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCall, registerScreenPopCall, completeActiveCall, dismissActiveCall } =
    useTelephony();
  const { addTicket } = useCustomer();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [noteText, setNoteText] = useState('');

  const urlCallNumber = searchParams.get('callNumber');
  const urlExt = searchParams.get('ext') || undefined;
  const urlCallId = searchParams.get('callId') || undefined;

  // Hydrate activeCall if user refreshed or deep-linked directly with ?callNumber=...
  useEffect(() => {
    if (!urlCallNumber || activeCall?.customerId === customer.id) return;
    const normalized = normalizeThaiPhone(urlCallNumber);
    if (!normalized) return;

    registerScreenPopCall(
      {
        rawNumber: urlCallNumber,
        normalizedNumber: normalized,
        displayNumber: formatThaiPhoneDisplay(normalized),
        ext: urlExt,
        callId: urlCallId,
        direction: 'inbound',
      },
      {
        customer,
        matchedField: 'primary',
        matchedLabel: customer.name,
        matchedRawPhone: urlCallNumber,
        normalizedPhone: normalized,
      }
    );
  }, [urlCallNumber, urlExt, urlCallId, activeCall?.customerId, customer, registerScreenPopCall]);

  const isCallForThisCustomer = activeCall && activeCall.customerId === customer.id;
  if (!isCallForThisCustomer) {
    return null;
  }

  const clearCallSearchParams = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('callNumber');
    next.delete('ext');
    next.delete('callId');
    setSearchParams(next, { replace: true });
  };

  const handleSaveCallSummary = (e: React.FormEvent) => {
    e.preventDefault();
    completeActiveCall(noteText);
    setNoteText('');
    clearCallSearchParams();
    showToast('บันทึกประวัติสายสนทนาลง Timeline ลูกค้าเรียบร้อยแล้ว', 'success');
  };

  const handleQuickCreateTicket = () => {
    const ticketTitle =
      noteText.trim() || `ติดตามเรื่องจากสายเรียกเข้า 3CX (${activeCall.phone})`;
    addTicket({
      customerId: customer.id,
      customerName: customer.name,
      customerTier: customer.tier,
      title: ticketTitle,
      category: 'Inquiry',
      channel: '3CX',
      status: 'Open',
      slaHoursLeft: 8,
      slaFormatted: '8 ชม.',
      slaStatus: 'normal',
      assignee: currentUser?.name || 'วิภา ส.',
    });
    completeActiveCall(`สร้าง Ticket จากสายสนทนา: ${ticketTitle}`);
    setNoteText('');
    clearCallSearchParams();
    showToast('เปิด Ticket ใหม่จากสาย 3CX และบันทึกลง Timeline แล้ว', 'success');
  };

  const handleDismiss = () => {
    dismissActiveCall();
    clearCallSearchParams();
  };

  return (
    <div
      className={`bg-white border border-brand/40 rounded-card p-3.5 shadow-card space-y-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-bg-subtle border border-border text-brand flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>กำลังสนทนาสาย 3CX</span>
          </span>
          <span className="font-mono text-sm font-bold text-text-primary">
            {activeCall.phone}
          </span>
          {activeCall.matchedContactName && (
            <span className="text-xs text-text-secondary">
              · ผู้ติดต่อ: <strong className="text-text-primary">{activeCall.matchedContactName}</strong>
            </span>
          )}
          {activeCall.ext && (
            <span className="font-mono text-[11px] text-text-secondary">
              · Ext: {activeCall.ext}
            </span>
          )}
          {activeCall.callId && (
            <span className="font-mono text-[11px] text-text-secondary">
              · Call ID: {activeCall.callId}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="ปิดแถบสายสนทนา"
          className="p-1 text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-subtle transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSaveCallSummary} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="พิมพ์สรุปผลการคุยสายสั้นๆ เพื่อบันทึกลง Timeline ลูกค้า..."
          className="flex-1 px-3 py-1.5 text-xs bg-bg-subtle border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>บันทึกลง Timeline</span>
          </button>
          <button
            type="button"
            onClick={handleQuickCreateTicket}
            className="px-3 py-1.5 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-brand" />
            <span>เปิด Ticket ด่วน</span>
          </button>
        </div>
      </form>
    </div>
  );
};
