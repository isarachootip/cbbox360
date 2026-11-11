import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { TicketTable } from '../components/service/TicketTable';
import { TicketDetailDrawer } from '../components/service/TicketDetailDrawer';
import { NewTicketModal, NewTicketPayload } from '../components/service/NewTicketModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';

export const ServiceCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isServiceRightPanelOpen, toggleServiceRightPanel } = useLayout();
  const {
    tickets,
    customers,
    setSelectedCustomerId,
    addTicket,
    updateTicketStatus,
    addTicketLog,
  } = useCustomer();

  const [selectedTicketId, setSelectedTicketId] = useState<string>('TK-2310');
  const [viewFilter, setViewFilter] = useState('Ticket ของฉัน');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = tickets.filter((t) => {
    if (viewFilter === 'เกิน SLA' && t.slaStatus !== 'danger') return false;
    if (typeFilter !== 'ทั้งหมด' && t.category !== typeFilter) return false;
    return true;
  });

  const handleCreateTicket = (payload: NewTicketPayload) => {
    addTicket({
      ...payload,
      slaHoursLeft: 4,
      slaStatus: 'normal',
      slaTargetNote: `${payload.customerTier}: ตอบแรก 1-4 ชม. · ปิด 1-2 วันทำการ`,
    });
    showToast('สร้าง Ticket ใหม่เรียบร้อยแล้ว', 'success');
    setIsAddTicketModalOpen(false);
  };

  const sharedDrawerProps = {
    ticket: selectedTicket,
    onOpenCustomer: (custId: string) => {
      setSelectedCustomerId(custId);
      navigate(`/customers/${custId}`);
    },
    onAddLogNote: (note: string) => {
      addTicketLog(selectedTicket.id, note, 'วิภา ส.');
      showToast('บันทึก Log note สำเร็จ', 'success');
    },
    onSetReminder: () =>
      showToast(`ตั้งการแจ้งเตือนสำหรับ Ticket ${selectedTicket.id} ในอีก 1 ชั่วโมง`, 'info'),
    onEscalate: () => {
      addTicketLog(selectedTicket.id, 'Escalate เรื่องส่งต่อไปยัง Supervisor (สมหญิง ร.)', 'วิภา ส.');
      showToast(`ส่งต่อ Ticket ${selectedTicket.id} ไปยังหัวหน้างานแล้ว`, 'warning');
    },
    onCloseTicket: () => {
      updateTicketStatus(selectedTicket.id, 'Closed');
      addTicketLog(selectedTicket.id, 'ปิด Ticket เรียบร้อยแล้ว', 'วิภา ส.');
      showToast(`ปิด Ticket ${selectedTicket.id} สำเร็จ`, 'success');
    },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        title="Service / Case"
        subtitle="จัดการเคสบริการและ SLA ลูกค้า"
        centerControls={
          <div className="flex items-center gap-2.5 select-none">
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="Ticket ของฉัน">มุมมอง: Ticket ของฉัน</option>
              <option value="Ticket ทั้งหมด">มุมมอง: Ticket ทั้งหมด</option>
              <option value="เกิน SLA">มุมมอง: เกิน SLA</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ทั้งหมด">หมวด: ทั้งหมด</option>
              <option value="Complaint">Complaint (ร้องเรียน)</option>
              <option value="Inquiry">Inquiry (สอบถาม)</option>
              <option value="Claim">Claim (เคลม)</option>
              <option value="Request">Request (คำร้องขอ)</option>
              <option value="Billing">Billing (บิล/ใบเสร็จ)</option>
              <option value="Credit">Credit (สินเชื่อ)</option>
              <option value="DSR">DSR (PDPA)</option>
            </select>
          </div>
        }
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddTicketModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้าง Ticket</span>
            </button>
            <button
              type="button"
              onClick={toggleServiceRightPanel}
              title={isServiceRightPanelOpen ? 'พับเก็บแผงรายละเอียดเคส' : 'เปิดแผงรายละเอียดเคสด้านขวา'}
              aria-label={isServiceRightPanelOpen ? 'พับเก็บแผงรายละเอียดเคส' : 'เปิดแผงรายละเอียดเคสด้านขวา'}
              className={`hidden lg:inline-flex p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isServiceRightPanelOpen
                  ? 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                  : 'border-brand/30 bg-brand-tint/60 text-brand hover:bg-brand-tint'
              }`}
            >
              {isServiceRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto custom-scrollbar gap-4 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 flex-shrink-0">
            <KpiTile label="Ticket เปิดอยู่" value={128} variant="default" />
            <KpiTile label="เกิน SLA" value={6} variant="danger" />
            <KpiTile label="ปิดวันนี้" value={54} variant="success" />
            <KpiTile label="CSAT 30 วัน" value="4.6 / 5" variant="highlight" />
          </div>

          <TicketTable
            tickets={filteredTickets}
            selectedTicketId={selectedTicket.id}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setIsMobileDetailOpen(true);
            }}
          />
        </div>

        {isServiceRightPanelOpen && selectedTicket && (
          <div className="hidden lg:block h-full">
            <TicketDetailDrawer {...sharedDrawerProps} onCollapseDrawer={toggleServiceRightPanel} />
          </div>
        )}
      </div>

      {isMobileDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs" onClick={() => setIsMobileDetailOpen(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between select-none">
              <span className="font-bold text-sm text-text-primary">รายละเอียด Ticket</span>
              <button type="button" onClick={() => setIsMobileDetailOpen(false)} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100" aria-label="ปิด">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TicketDetailDrawer {...sharedDrawerProps} />
            </div>
          </div>
        </div>
      )}

      <NewTicketModal
        isOpen={isAddTicketModalOpen}
        customers={customers}
        onClose={() => setIsAddTicketModalOpen(false)}
        onCreate={handleCreateTicket}
      />
    </div>
  );
};
