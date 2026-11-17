import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PhoneCall,
  PhoneOutgoing,
  CheckCircle2,
  Headphones,
  ExternalLink,
  X,
} from 'lucide-react';
import { useTelephony } from '../../context/TelephonyContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useBot } from '../../context/BotContext';
import { useToast } from '../../context/ToastContext';
import { formatElapsedDuration } from '../../domain/telephony/callLogHelpers';
import { parsePbxConfig } from '../../domain/telephony/clickToCall';
import { focusOrReopenPbxWindow } from '../../hooks/useClickToCall';

export const GlobalActiveCallBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCall, completeActiveCall, dismissActiveCall } = useTelephony();
  const { customers, addTicket } = useCustomer();
  const { currentUser } = useAuth();
  const { settings } = useBot();
  const { showToast } = useToast();

  const [noteText, setNoteText] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!activeCall) return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeCall]);

  if (!activeCall) {
    return null;
  }

  const pbxConfig = parsePbxConfig(settings.pbxConfig);
  const matchedCustomer = activeCall.customerId
    ? customers.find((c) => c.id === activeCall.customerId)
    : undefined;
  const elapsedLabel = formatElapsedDuration(activeCall.startedAtMs, nowMs);
  const isOutbound = activeCall.direction === 'outbound';
  const Icon = isOutbound ? PhoneOutgoing : PhoneCall;

  const clearCallSearchParams = () => {
    if (!searchParams.has('callNumber') && !searchParams.has('ext') && !searchParams.has('callId')) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('callNumber');
    next.delete('ext');
    next.delete('callId');
    setSearchParams(next, { replace: true });
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    completeActiveCall(noteText);
    setNoteText('');
    clearCallSearchParams();
    showToast('บันทึกประวัติสายสนทนาลง Call Logs & Timeline ลูกค้าเรียบร้อยแล้ว', 'success');
  };

  const handleQuickCreateTicket = () => {
    if (!matchedCustomer) {
      showToast('สายนี้ยังไม่ได้ผูกโปรไฟล์ลูกค้า จึงบันทึกเฉพาะประวัติการโทร', 'info');
      completeActiveCall(noteText);
      setNoteText('');
      clearCallSearchParams();
      return;
    }
    const ticketTitle =
      noteText.trim() ||
      `ติดตามเรื่องจาก${isOutbound ? 'สายโทรออก' : 'สายเรียกเข้า'} 3CX (${activeCall.phone})`;
    addTicket({
      customerId: matchedCustomer.id,
      customerName: matchedCustomer.name,
      customerTier: matchedCustomer.tier,
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

  const handleFocusWebPhone = () => {
    const targetUrl = activeCall.dialUrl || pbxConfig.phoneUrl;
    const ok = focusOrReopenPbxWindow(targetUrl, pbxConfig.windowName);
    if (!ok) {
      showToast('ไม่สามารถสลับไปยังแท็บโทรศัพท์ได้ กรุณาตรวจสอบ Pop-up Blocker', 'warning');
    }
  };

  const handleDismiss = () => {
    dismissActiveCall();
    setNoteText('');
    clearCallSearchParams();
  };

  return (
    <div className="bg-white border-b border-brand/30 px-4 py-2.5 shadow-xs z-20 flex-shrink-0">
      <div className="max-w-[1640px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border text-brand flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isOutbound ? 'กำลังโทรออก (PABX)' : 'กำลังสนทนาสาย 3CX'}</span>
          </span>
          <span className="font-mono text-xs font-semibold text-brand tabular-nums">
            {elapsedLabel}
          </span>
          <span className="font-mono text-sm font-bold text-text-primary">{activeCall.phone}</span>

          {activeCall.customerId && activeCall.customerName && (
            <Link
              to={`/customers/${activeCall.customerId}`}
              className="text-brand hover:underline font-semibold"
            >
              · {activeCall.customerName}
            </Link>
          )}
          {activeCall.matchedContactName && (
            <span className="text-text-secondary">({activeCall.matchedContactName})</span>
          )}
          {activeCall.ext && (
            <span className="font-mono text-[11px] text-text-secondary">· Ext: {activeCall.ext}</span>
          )}

          <button
            type="button"
            onClick={handleFocusWebPhone}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:border-brand/50 hover:bg-bg-subtle text-[11px] font-semibold text-brand transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>เปิดแท็บ WebPhone</span>
          </button>
        </div>

        <form onSubmit={handleSaveSummary} className="flex items-center gap-2 flex-1 lg:max-w-xl">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="พิมพ์สรุปผลการคุยสายสั้นๆ เพื่อบันทึกลง Timeline..."
            className="flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-bg-subtle border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>บันทึกสาย</span>
          </button>
          {matchedCustomer && (
            <button
              type="button"
              onClick={handleQuickCreateTicket}
              className="px-2.5 py-1.5 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold hidden sm:flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-brand" />
              <span>เปิด Ticket</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            title="วางสาย / ปิดแถบสนทนา"
            className="p-1.5 text-text-secondary hover:text-rose-600 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
