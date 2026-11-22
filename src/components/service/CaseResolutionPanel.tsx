import React, { useEffect, useState } from 'react';
import { Send, Wrench, Check } from 'lucide-react';
import type { Ticket } from '../../types';
import type { CasePatchInput } from '../../services/caseApi';

interface CaseResolutionPanelProps {
  ticket: Ticket;
  hasLinkedConversation: boolean;
  onSaveResolution: (patch: CasePatchInput) => void;
  onNotifyCustomer?: (message: string) => Promise<void>;
}

export const CaseResolutionPanel: React.FC<CaseResolutionPanelProps> = ({
  ticket,
  hasLinkedConversation,
  onSaveResolution,
  onNotifyCustomer,
}) => {
  const [rootCause, setRootCause] = useState(ticket.rootCause || '');
  const [resolutionSummary, setResolutionSummary] = useState(ticket.resolutionSummary || '');
  const [notifyText, setNotifyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setRootCause(ticket.rootCause || '');
    setResolutionSummary(ticket.resolutionSummary || '');
    setNotifyText('');
  }, [ticket.id, ticket.rootCause, ticket.resolutionSummary]);

  const isDirty =
    rootCause.trim() !== (ticket.rootCause || '').trim() ||
    resolutionSummary.trim() !== (ticket.resolutionSummary || '').trim();

  const applyQuickTemplate = (kind: 'progress' | 'waiting' | 'resolved') => {
    const sys = ticket.systemName ? ` (${ticket.systemName})` : '';
    if (kind === 'progress') {
      setNotifyText(`อัปเดตเคส ${ticket.id}${sys}: ขณะนี้ทีมงานกำลังดำเนินการตรวจสอบและแก้ไขให้ครับ`);
    } else if (kind === 'waiting') {
      setNotifyText(`อัปเดตเคส ${ticket.id}${sys}: รบกวนขอข้อมูลเพิ่มเติมหรือช่วยทดสอบหน้างานแล้วแจ้งกลับในแชทนี้ครับ`);
    } else {
      const detail = resolutionSummary.trim() ? ` ผลการแก้ไข: ${resolutionSummary.trim()}` : '';
      setNotifyText(`เคส ${ticket.id}${sys} ได้รับการแก้ไขเรียบร้อยแล้วครับ${detail} รบกวนตรวจสอบการใช้งานครับ`);
    }
  };

  const handleSendNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = notifyText.trim();
    if (!trimmed || !onNotifyCustomer) return;
    setIsSending(true);
    try {
      await onNotifyCustomer(trimmed);
      setNotifyText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-bg-subtle rounded-xl border border-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
            <Wrench className="w-3.5 h-3.5 text-brand" />
            <span>สาเหตุ &amp; สรุปวิธีแก้ไข (Root Cause / Resolution)</span>
          </span>
          {isDirty && (
            <button
              type="button"
              onClick={() => onSaveResolution({ rootCause: rootCause.trim(), resolutionSummary: resolutionSummary.trim() })}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand hover:bg-brand-hover text-white rounded-md text-[11px] font-semibold cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>บันทึก</span>
            </button>
          )}
        </div>

        <input
          type="text"
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="สาเหตุของปัญหา (Root Cause)..."
          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none focus:border-brand"
        />
        <textarea
          rows={2}
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
          placeholder="สรุปวิธีแก้ไข / การเปลี่ยนอะไหล่ (Resolution Summary)..."
          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none focus:border-brand resize-none"
        />
      </div>

      {onNotifyCustomer && (
        <form onSubmit={handleSendNotify} className="p-3 bg-bg-subtle rounded-xl border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">แจ้งอัปเดตลูกค้าทางแชท / LINE</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${hasLinkedConversation ? 'text-emerald-600' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasLinkedConversation ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{hasLinkedConversation ? 'พร้อมส่งเข้าแชท' : 'ไม่พบห้องแชท'}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => applyQuickTemplate('progress')} className="px-2 py-0.5 rounded-md border border-border bg-white hover:border-brand text-[11px] text-text-primary cursor-pointer">กำลังแก้ไข</button>
            <button type="button" onClick={() => applyQuickTemplate('waiting')} className="px-2 py-0.5 rounded-md border border-border bg-white hover:border-brand text-[11px] text-text-primary cursor-pointer">ขอข้อมูลเพิ่ม</button>
            <button type="button" onClick={() => applyQuickTemplate('resolved')} className="px-2 py-0.5 rounded-md border border-border bg-white hover:border-brand text-[11px] text-text-primary cursor-pointer">แจ้งแก้ไขเสร็จ</button>
          </div>

          <div className="flex items-end gap-1.5">
            <textarea
              rows={2}
              value={notifyText}
              disabled={!hasLinkedConversation || isSending}
              onChange={(e) => setNotifyText(e.target.value)}
              placeholder={hasLinkedConversation ? 'พิมพ์ข้อความแจ้งลูกค้า...' : 'ลูกค้ายังไม่มีห้องแชทใน Inbox'}
              className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs focus:outline-none focus:border-brand resize-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!hasLinkedConversation || !notifyText.trim() || isSending}
              className="px-3 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่ง</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
