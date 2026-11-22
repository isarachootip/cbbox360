import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Customer, Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { NewTicketModal, NewTicketPayload } from '../service/NewTicketModal';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CustomerSecondaryTabsProps {
  activeTab: 'Service' | 'Segments';
  customer: Customer;
  tickets: Ticket[];
}

export const CustomerSecondaryTabs: React.FC<CustomerSecondaryTabsProps> = ({
  activeTab,
  customer,
  tickets,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { customers, addTicket } = useCustomer();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateCase = (payload: NewTicketPayload) => {
    addTicket({
      ...payload,
      slaHoursLeft: payload.priority === 'Critical' ? 2 : payload.priority === 'High' ? 4 : 8,
      slaStatus: payload.priority === 'Critical' ? 'warning' : 'normal',
      slaTargetNote: `${payload.priority}: ${payload.slaFormatted}`,
    });
    showToast(`เปิด Case ใหม่ให้ ${customer.name} เรียบร้อยแล้ว`, 'success');
    setIsCreateOpen(false);
  };

  if (activeTab === 'Service') {
    const customerTickets = tickets.filter((t) => t.customerId === customer.id);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">
            ประวัติ Case ทั้งหมด ({customerTickets.length})
          </span>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เปิด Case ใหม่</span>
          </button>
        </div>

        <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
          {customerTickets.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-secondary">
              ยังไม่มีประวัติ Case สำหรับลูกค้ารายนี้
            </div>
          ) : (
            customerTickets.map((t) => (
              <div key={t.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-bg-subtle">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-brand">{t.id}</span>
                    {t.externalTicketId && (
                      <span className="font-mono text-[11px] text-text-secondary">
                        Ref: {t.externalTicketId}
                      </span>
                    )}
                    <span className="font-semibold text-[14px] text-text-primary truncate">{t.title}</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {t.category}
                    {t.systemName ? ` · ระบบ ${t.systemName}` : ''} · ช่องทาง {t.channel} · {t.createdAt}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 select-none">
                  <StatusBadge status={t.status} />
                  <button
                    type="button"
                    onClick={() => navigate(`/cases?caseId=${encodeURIComponent(t.id)}`)}
                    className="text-xs text-brand font-semibold hover:underline cursor-pointer"
                  >
                    เปิดดู
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <NewTicketModal
          isOpen={isCreateOpen}
          customers={customers}
          initialCustomerId={customer.id}
          defaultAssignee={currentUser?.name || 'ทีม Helpdesk'}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateCase}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {customer.segments.map((seg, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl border border-border bg-bg-subtle flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-[13.5px] text-text-primary">{seg}</div>
            <div className="text-xs text-text-secondary mt-0.5">Dynamic CDP Cohort</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/segments')}
            className="text-xs text-brand font-semibold hover:underline select-none cursor-pointer"
          >
            เปิดเงื่อนไข
          </button>
        </div>
      ))}
    </div>
  );
};
