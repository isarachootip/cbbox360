import React, { useState } from 'react';
import { ExternalLink, PanelRightClose } from 'lucide-react';
import { Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface TicketDetailDrawerProps {
  ticket: Ticket;
  onOpenCustomer: (customerId: string) => void;
  onAddLogNote: (note: string) => void;
  onSetReminder: () => void;
  onEscalate: () => void;
  onCloseTicket: () => void;
  onCollapseDrawer?: () => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  onOpenCustomer,
  onAddLogNote,
  onSetReminder,
  onEscalate,
  onCloseTicket,
  onCollapseDrawer,
}) => {
  const [logNoteInput, setLogNoteInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = logNoteInput.trim();
    if (!trimmed) return;
    onAddLogNote(trimmed);
    setLogNoteInput('');
  };

  return (
    <div className="w-full lg:w-[400px] xl:w-[424px] flex-shrink-0 bg-white border-l border-border h-full flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-4">
      {/* Header */}
      <div className="pb-3.5 border-b border-divider">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-[15px] text-brand tabular-nums">
              {ticket.id}
            </span>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono tabular-nums font-semibold ${
                ticket.slaStatus === 'danger' ? 'text-rose-600' : 'text-text-secondary'
              }`}
            >
              SLA {ticket.slaFormatted}
            </span>
            {onCollapseDrawer && (
              <button
                type="button"
                onClick={onCollapseDrawer}
                title="พับเก็บแผงรายละเอียดเคส"
                aria-label="พับเก็บแผงรายละเอียดเคส"
                className="hidden lg:inline-flex p-1 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-colors select-none"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-[16px] font-bold text-text-primary mt-2 leading-snug">
          {ticket.title}
        </h3>

        <div className="text-xs text-text-secondary mt-1">
          ช่องทาง <span className="font-mono font-medium text-text-body2">{ticket.channel}</span> ·{' '}
          {ticket.createdAt || '26 ก.ย. 10:42'} · ผู้รับผิดชอบ{' '}
          <span className="font-medium text-text-body2">{ticket.assignee}</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg-subtle rounded-xl border border-border text-[13px]">
        <div>
          <span className="text-xs text-text-secondary block">ลูกค้า</span>
          <button
            type="button"
            onClick={() => onOpenCustomer(ticket.customerId)}
            className="font-semibold text-brand hover:underline cursor-pointer flex items-center gap-1 mt-0.5 text-left"
          >
            <span>{ticket.customerName}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </button>
        </div>

        <div>
          <span className="text-xs text-text-secondary block">ประเภท / หมวด</span>
          <span className="font-semibold text-text-primary mt-0.5 block">
            {ticket.category}
          </span>
        </div>

        <div className="col-span-2 pt-2.5 border-t border-divider">
          <span className="text-xs text-text-secondary block">ข้อตกลง SLA ({ticket.customerTier})</span>
          <span className="font-medium text-text-primary mt-0.5 block text-xs">
            {ticket.slaTargetNote || 'Platinum: ตอบแรก 1 ชม. · ปิด 1 วันทำการ'}
          </span>
        </div>

        {ticket.orderRef && (
          <div className="col-span-2 pt-2.5 border-t border-divider flex items-center justify-between">
            <span className="text-xs text-text-secondary">อ้างอิง Order</span>
            <span className="font-mono tabular-nums font-bold text-text-primary text-xs">
              {ticket.orderRef} · ฿{ticket.orderAmount?.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 space-y-3">
        <div className="text-xs font-bold text-text-secondary uppercase tracking-[0.06em]">
          Activity Log
        </div>

        <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider text-[13px]">
          {ticket.activityLogs.map((log, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white shadow-2xs" />
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-text-primary">{log.author}</span>
                <span className="text-[11px] font-mono tabular-nums text-text-secondary">
                  {log.time}
                </span>
              </div>
              <p className="text-text-body2 mt-0.5 leading-[1.6]">{log.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Log Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-3 border-t border-divider">
        <div className="text-xs font-semibold text-text-secondary select-none">
          บันทึกความคืบหน้า (Internal Log Note)
        </div>
        <textarea
          rows={2}
          value={logNoteInput}
          onChange={(e) => setLogNoteInput(e.target.value)}
          placeholder="พิมพ์บันทึกการประสานงาน... ใช้ @ เพื่อแท็กทีมงาน"
          className="w-full px-3 py-2 text-[13.5px] leading-[1.6] border border-border rounded-xl focus:outline-none focus:border-brand resize-none bg-bg-subtle focus:bg-white"
        />
        {logNoteInput.trim() && (
          <div className="flex justify-end select-none">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              บันทึก Note
            </button>
          </div>
        )}
      </form>

      {/* Bottom Action Bar */}
      <div className="grid grid-cols-3 gap-2 pt-1 select-none">
        <button
          type="button"
          onClick={onSetReminder}
          className="py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium transition-colors"
        >
          ตั้งเตือน
        </button>
        <button
          type="button"
          onClick={onEscalate}
          className="py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium transition-colors"
        >
          Escalate
        </button>
        <button
          type="button"
          onClick={onCloseTicket}
          className="py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          ปิด Ticket
        </button>
      </div>
    </div>
  );
};
