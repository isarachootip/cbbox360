import React, { useEffect, useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { ServiceMode, Ticket, TicketPriority, TicketStatus } from '../../types';
import {
  CASE_PRIORITY_OPTIONS,
  CASE_STATUS_OPTIONS,
  SERVICE_MODE_OPTIONS,
} from '../../domain/cases/caseMetrics';
import { useAuth } from '../../context/AuthContext';
import type { CasePatchInput } from '../../services/caseApi';

interface CaseStatusControlsProps {
  ticket: Ticket;
  onUpdateStatus: (status: TicketStatus) => void;
  onUpdateDetails: (patch: CasePatchInput) => void;
}

export const CaseStatusControls: React.FC<CaseStatusControlsProps> = ({
  ticket,
  onUpdateStatus,
  onUpdateDetails,
}) => {
  const { users } = useAuth();
  const [extRef, setExtRef] = useState<string>(ticket.externalTicketId || '');
  const [isEditingRef, setIsEditingRef] = useState<boolean>(false);

  const assigneeOptions = Array.from(
    new Set([ticket.assignee, ...users.filter((u) => u.status === 'active').map((u) => u.name)].filter(Boolean))
  );

  useEffect(() => {
    setExtRef(ticket.externalTicketId || '');
    setIsEditingRef(false);
  }, [ticket.id, ticket.externalTicketId]);

  const handleSaveRef = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = extRef.trim();
    onUpdateDetails({
      externalTicketId: cleaned || null,
      externalSystem: cleaned ? ticket.externalSystem || 'External Helpdesk' : null,
    });
    setIsEditingRef(false);
  };

  return (
    <div className="space-y-2.5 p-3 bg-bg-subtle rounded-xl border border-border text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">สถานะเคส</label>
          <select
            value={ticket.status}
            onChange={(e) => onUpdateStatus(e.target.value as TicketStatus)}
            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            {CASE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">ความเร่งด่วน</label>
          <select
            value={ticket.priority || 'Normal'}
            onChange={(e) => onUpdateDetails({ priority: e.target.value as TicketPriority })}
            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            {CASE_PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">ผู้รับผิดชอบ (Assignee)</label>
          <select
            value={ticket.assignee}
            onChange={(e) => onUpdateDetails({ assignee: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">ประเภทบริการ</label>
          <select
            value={ticket.serviceMode || 'Remote'}
            onChange={(e) => onUpdateDetails({ serviceMode: e.target.value as ServiceMode })}
            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            {SERVICE_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-divider">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary">
            <Link2 className="w-3 h-3 text-brand" />
            <span>Helpdesk Ref (External Link)</span>
          </span>
          {!isEditingRef && (
            <button
              type="button"
              onClick={() => setIsEditingRef(true)}
              className="text-[11px] font-semibold text-brand hover:underline cursor-pointer"
            >
              {ticket.externalTicketId ? 'แก้ไข' : '+ ผูกเลขอ้างอิง'}
            </button>
          )}
        </div>

        {isEditingRef ? (
          <form onSubmit={handleSaveRef} className="flex items-center gap-1.5 mt-1.5">
            <input
              type="text"
              value={extRef}
              onChange={(e) => setExtRef(e.target.value)}
              placeholder="เช่น HD-90412"
              className="flex-1 px-2.5 py-1 font-mono text-xs bg-white border border-brand rounded-lg focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>บันทึก</span>
            </button>
          </form>
        ) : (
          <div className="mt-1 font-mono text-xs text-text-primary">
            {ticket.externalTicketId ? (
              <span>
                {ticket.externalTicketId}
                {ticket.externalSystem ? (
                  <span className="font-sans text-text-secondary"> · {ticket.externalSystem}</span>
                ) : null}
              </span>
            ) : (
              <span className="font-sans text-text-muted">ยังไม่เชื่อมเลขระบบ Helpdesk ภายนอก</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
