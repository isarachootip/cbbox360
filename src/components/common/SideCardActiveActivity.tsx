import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Deal, Ticket } from '../../types';

interface SideCardActiveActivityProps {
  activeDeal?: Deal;
  activeTicket?: Ticket;
}

export const SideCardActiveActivity: React.FC<SideCardActiveActivityProps> = ({
  activeDeal,
  activeTicket,
}) => {
  const navigate = useNavigate();
  if (!activeDeal && !activeTicket) return null;

  return (
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
          onClick={() => navigate(`/cases?caseId=${encodeURIComponent(activeTicket.id)}`)}
          className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
        >
          <div className="min-w-0">
            <div className="text-text-secondary text-xs truncate">
              Case <span className="font-mono font-medium">{activeTicket.id}</span>
              {activeTicket.systemName ? ` · ${activeTicket.systemName}` : ''}
            </div>
            <div className="inline-flex items-center gap-1.5 font-medium text-amber-600 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="tabular-nums">SLA เหลือ {activeTicket.slaFormatted}</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />
        </div>
      )}
    </div>
  );
};
