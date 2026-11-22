import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, PanelRightClose, PanelRightOpen, Search, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { TicketTable } from '../components/service/TicketTable';
import { TicketDetailDrawer } from '../components/service/TicketDetailDrawer';
import { NewTicketModal, NewTicketPayload } from '../components/service/NewTicketModal';
import { useCustomer } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';
import { useLabel } from '../../core/client/hooks/useLabel';
import { computeCaseKpis, matchesCaseSearch } from '../domain/cases/caseMetrics';

export const ServiceCasePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { isServiceRightPanelOpen, toggleServiceRightPanel } = useLayout();
  const { caseCategories } = useTenantRuntime();
  const { t } = useLabel();
  const {
    tickets, customers, setSelectedCustomerId,
    addTicket, updateTicketStatus, updateTicketDetails, addTicketLog,
  } = useCustomer();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(searchParams.get('caseId') || '');
  const [viewFilter, setViewFilter] = useState('Case ทั้งหมด');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [searchText, setSearchText] = useState('');
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  useEffect(() => {
    const requestedId = searchParams.get('caseId');
    if (requestedId) setSelectedTicketId(requestedId);
  }, [searchParams]);

  const kpis = computeCaseKpis(tickets);
  const filteredTickets = tickets.filter((tk) => {
    if (viewFilter === 'เปิดอยู่' && (tk.status === 'Closed' || tk.status === 'Resolved')) return false;
    if (viewFilter === 'เกิน SLA' && tk.slaStatus !== 'danger') return false;
    if (viewFilter === 'ปิดแล้ว' && tk.status !== 'Closed' && tk.status !== 'Resolved') return false;
    if (typeFilter !== 'ทั้งหมด' && tk.category !== typeFilter) return false;
    return matchesCaseSearch(tk, searchText);
  });

  const selectedTicket =
    tickets.find((tk) => tk.id === selectedTicketId) || filteredTickets[0] || tickets[0];
  const actorName = currentUser?.name || 'เจ้าหน้าที่';

  const handleCreateTicket = (payload: NewTicketPayload) => {
    addTicket({
      ...payload,
      slaHoursLeft: payload.priority === 'Critical' ? 2 : payload.priority === 'High' ? 4 : 8,
      slaStatus: payload.priority === 'Critical' ? 'warning' : 'normal',
      slaTargetNote: `${payload.priority}: ${payload.slaFormatted}`,
    });
    showToast('เปิด Case ใหม่และบันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    setIsAddTicketModalOpen(false);
  };

  const sharedDrawerProps = selectedTicket
    ? {
        ticket: selectedTicket,
        onOpenCustomer: (custId: string) => {
          setSelectedCustomerId(custId);
          navigate(`/customers/${custId}`);
        },
        onUpdateStatus: (status: typeof selectedTicket.status) => {
          updateTicketStatus(selectedTicket.id, status);
          showToast(`อัปเดตสถานะ ${selectedTicket.id} เป็น ${status} แล้ว`, 'success');
        },
        onUpdateDetails: (patch: Parameters<typeof updateTicketDetails>[1]) => {
          updateTicketDetails(selectedTicket.id, patch);
          showToast(`อัปเดตข้อมูลเคส ${selectedTicket.id} เรียบร้อย`, 'success');
        },
        onAddLogNote: (note: string) => {
          addTicketLog(selectedTicket.id, note, actorName);
          showToast('บันทึก Log note สำเร็จ', 'success');
        },
        onSetReminder: () =>
          showToast(`ตั้งการแจ้งเตือนสำหรับ Case ${selectedTicket.id} ในอีก 1 ชั่วโมง`, 'info'),
        onEscalate: () => {
          updateTicketDetails(selectedTicket.id, { priority: 'Critical' });
          addTicketLog(selectedTicket.id, 'Escalate ส่งต่อหัวหน้างาน (Supervisor)', actorName);
          showToast(`ส่งต่อ Case ${selectedTicket.id} ไปยังหัวหน้างานแล้ว`, 'warning');
        },
        onCloseTicket: () => {
          updateTicketStatus(selectedTicket.id, 'Closed');
          showToast(`ปิด Case ${selectedTicket.id} สำเร็จ`, 'success');
        },
      }
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        title={t('case.plural', 'Service / Case')}
        subtitle="จัดการเคสบริการ ติดตามปัญหา และ SLA ลูกค้า"
        centerControls={
          <div className="flex items-center gap-2 select-none flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="ค้นหา Case / ระบบ / External Ref" className="pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand w-52" />
            </div>

            <select value={viewFilter} onChange={(e) => setViewFilter(e.target.value)} className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer">
              <option value="Case ทั้งหมด">มุมมอง: ทั้งหมด</option>
              <option value="เปิดอยู่">มุมมอง: กำลังเปิดอยู่</option>
              <option value="เกิน SLA">มุมมอง: เกิน SLA</option>
              <option value="ปิดแล้ว">มุมมอง: แก้ไข/ปิดแล้ว</option>
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer">
              <option value="ทั้งหมด">หมวด: ทั้งหมด</option>
              {(caseCategories.length > 0
                ? caseCategories.map((c) => c.name)
                : Array.from(new Set(tickets.map((tk) => tk.category)))
              ).map((catName) => (
                <option key={catName} value={catName}>{catName}</option>
              ))}
            </select>
          </div>
        }
        actionButton={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsAddTicketModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>เปิด {t('case.singular', 'Case')}</span>
            </button>
            <button type="button" onClick={toggleServiceRightPanel} title={isServiceRightPanelOpen ? 'พับเก็บแผงรายละเอียดเคส' : 'เปิดแผงรายละเอียดเคสด้านขวา'} aria-label={isServiceRightPanelOpen ? 'พับเก็บแผงรายละเอียดเคส' : 'เปิดแผงรายละเอียดเคสด้านขวา'} className={`hidden lg:inline-flex p-1.5 rounded-lg border transition-colors cursor-pointer ${isServiceRightPanelOpen ? 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle' : 'border-brand/30 bg-brand-tint/60 text-brand hover:bg-brand-tint'}`}>
              {isServiceRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto custom-scrollbar gap-4 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 flex-shrink-0">
            <KpiTile label="Case เปิดอยู่" value={kpis.openCount} variant="default" />
            <KpiTile label="กำลังดำเนินการ" value={kpis.inProgressCount} variant="highlight" />
            <KpiTile label="เกิน SLA" value={kpis.overSlaCount} variant="danger" />
            <KpiTile label="แก้ไขแล้ว / ปิดงาน" value={kpis.closedOrResolvedCount} variant="success" />
          </div>

          <TicketTable
            tickets={filteredTickets}
            selectedTicketId={selectedTicket?.id || ''}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setIsMobileDetailOpen(true);
            }}
          />
        </div>

        {isServiceRightPanelOpen && sharedDrawerProps && (
          <div className="hidden lg:block h-full">
            <TicketDetailDrawer {...sharedDrawerProps} onCollapseDrawer={toggleServiceRightPanel} />
          </div>
        )}
      </div>

      {isMobileDetailOpen && sharedDrawerProps && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs" onClick={() => setIsMobileDetailOpen(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between select-none">
              <span className="font-bold text-sm text-text-primary">รายละเอียด Case</span>
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
        defaultAssignee={actorName}
        onClose={() => setIsAddTicketModalOpen(false)}
        onCreate={handleCreateTicket}
      />
    </div>
  );
};
