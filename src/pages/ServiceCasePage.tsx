import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Send,
  Bell,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { TierBadge } from '../components/common/TierBadge';
import { ChannelChip } from '../components/common/ChannelChip';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { Ticket, TierType, ChannelType } from '../types';

export const ServiceCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    tickets,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    addTicket,
    updateTicketStatus,
    addTicketLog,
  } = useCustomer();

  // Selected Ticket
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TK-2310');
  const [viewFilter, setViewFilter] = useState('Ticket ของฉัน');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');

  // Log note input
  const [logNoteInput, setLogNoteInput] = useState('');

  // Modal: + สร้าง Ticket
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    customerId: 'C00123',
    customerName: 'สมชาย ใจดี',
    customerTier: 'PLATINUM' as TierType,
    title: '',
    category: 'Complaint' as Ticket['category'],
    channel: 'LINE' as ChannelType,
    status: 'Open' as Ticket['status'],
    slaFormatted: '4 ชม.',
    assignee: 'วิภา ส.',
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[1];

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (typeFilter !== 'ทั้งหมด' && t.category !== typeFilter) return false;
    return true;
  });

  const handleOpenCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    navigate(`/customers/${custId}`);
  };

  const handleAddLogNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNoteInput.trim()) return;

    addTicketLog(selectedTicket.id, logNoteInput.trim(), 'วิภา ส.');
    showToast('บันทึก Log note สำเร็จ', 'success');
    setLogNoteInput('');
  };

  const handleCloseTicket = () => {
    updateTicketStatus(selectedTicket.id, 'Closed');
    addTicketLog(selectedTicket.id, 'ปิด Ticket เรียบร้อยแล้ว', 'วิภา ส.');
    showToast(`ปิด Ticket ${selectedTicket.id} สำเร็จ`, 'success');
  };

  const handleEscalate = () => {
    addTicketLog(selectedTicket.id, 'Escalate เรื่องส่งต่อไปยัง Supervisor (สมหญิง ร.)', 'วิภา ส.');
    showToast(`ส่งต่อ Ticket ${selectedTicket.id} ไปยังหัวหน้างานแล้ว`, 'warning');
  };

  const handleSetReminder = () => {
    showToast(`ตั้งการแจ้งเตือนสำหรับ Ticket ${selectedTicket.id} ในอีก 1 ชั่วโมง`, 'info');
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title) return;

    const matchedCust = customers.find(c => c.id === newTicketForm.customerId) || customers[0];

    addTicket({
      customerId: matchedCust.id,
      customerName: matchedCust.name,
      customerTier: matchedCust.tier,
      title: newTicketForm.title,
      category: newTicketForm.category,
      channel: newTicketForm.channel,
      status: newTicketForm.status,
      slaHoursLeft: 4,
      slaFormatted: newTicketForm.slaFormatted,
      slaStatus: 'normal',
      assignee: newTicketForm.assignee,
      slaTargetNote: `${matchedCust.tier}: ตอบแรก 1-4 ชม. · ปิด 1-2 วันทำการ`,
    });

    showToast(`สร้าง Ticket ใหม่เรียบร้อยแล้ว`, 'success');
    setIsAddTicketModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Service / Case"
        centerControls={
          <div className="flex items-center gap-2.5">
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="Ticket ของฉัน">มุมมอง: Ticket ของฉัน ▾</option>
              <option value="Ticket ทั้งหมด">มุมมอง: Ticket ทั้งหมด ▾</option>
              <option value="เกิน SLA">มุมมอง: เกิน SLA ▾</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ทั้งหมด">ประเภท: ทั้งหมด ▾</option>
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
          <button
            onClick={() => setIsAddTicketModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้าง Ticket</span>
          </button>
        }
      />

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= LEFT COLUMN: KPI + TICKET TABLE (1fr) ================= */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar gap-4">
          
          {/* KPI Tiles (4 metrics) */}
          <div className="grid grid-cols-4 gap-4 flex-shrink-0">
            <KpiTile
              label="Ticket เปิดอยู่"
              value={128}
              variant="default"
            />
            <KpiTile
              label="เกิน SLA"
              value={6}
              variant="danger"
            />
            <KpiTile
              label="ปิดวันนี้"
              value={54}
              variant="default"
            />
            <KpiTile
              label="CSAT 30 วัน"
              value="4.6 / 5"
              variant="default"
            />
          </div>

          {/* Ticket Table */}
          <div className="bg-white rounded-card border border-border overflow-hidden shadow-card flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-muted text-text-secondary border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">Ticket</th>
                    <th className="px-3.5 py-2.5 font-medium">หัวข้อ</th>
                    <th className="px-3.5 py-2.5 font-medium">ลูกค้า</th>
                    <th className="px-3.5 py-2.5 font-medium">หมวด / ช่องทาง</th>
                    <th className="px-3.5 py-2.5 font-medium">สถานะ</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredTickets.map((t) => {
                    const isSelected = t.id === selectedTicket.id;
                    const tierLetter = t.customerTier.slice(0, 1);

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-selected border-l-[3px] border-brand'
                            : 'hover:bg-bg-subtle border-l-[3px] border-transparent'
                        }`}
                      >
                        <td className="px-3.5 py-2.5 font-mono font-bold text-brand">
                          {t.id}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-text-primary max-w-[200px] truncate">
                          {t.title}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-primary font-medium">{t.customerName}</span>
                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center font-mono">
                              {tierLetter}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-text-secondary">
                          <span>{t.category}</span>
                          <span className="mx-1">·</span>
                          <span className="font-mono">{t.channel}</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold">
                          <span
                            className={
                              t.slaStatus === 'danger'
                                ? 'text-rose-600 font-bold'
                                : 'text-text-primary'
                            }
                          >
                            {t.slaFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: TICKET DETAIL DRAWER (420px) ================= */}
        <div className="w-[420px] flex-shrink-0 bg-white border-l border-border h-full flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-4">
          
          {/* Header */}
          <div className="pb-3 border-b border-divider">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-base text-brand">
                {selectedTicket.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <StatusBadge status={selectedTicket.status} />
                <span className="text-text-secondary font-normal">· SLA เหลือ {selectedTicket.slaFormatted}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-text-primary mt-2">
              {selectedTicket.title}
            </h3>

            <div className="text-xs text-text-secondary mt-1">
              สร้างจากแชท {selectedTicket.channel} · 26 ก.ย. 10:42 · ผู้รับผิดชอบ {selectedTicket.assignee}
            </div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg-subtle rounded-lg border border-border text-xs">
            <div>
              <span className="text-text-secondary block">ลูกค้า</span>
              <div
                onClick={() => handleOpenCustomer(selectedTicket.customerId)}
                className="font-bold text-brand hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
              >
                <span>{selectedTicket.customerName}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div>
              <span className="text-text-secondary block">ประเภท / หมวด</span>
              <span className="font-semibold text-text-primary mt-0.5 block">
                {selectedTicket.category} · จัดส่ง
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-divider">
              <span className="text-text-secondary block">SLA ({selectedTicket.customerTier})</span>
              <span className="font-medium text-text-primary mt-0.5 block">
                {selectedTicket.slaTargetNote || 'Platinum: ตอบแรก 1 ชม. · ปิด 1 วันทำการ'}
              </span>
            </div>

            {selectedTicket.orderRef && (
              <div className="col-span-2 pt-2 border-t border-divider flex items-center justify-between">
                <span className="text-text-secondary">อ้างอิง Order</span>
                <span className="font-mono font-bold text-text-primary">
                  {selectedTicket.orderRef} · ฿{selectedTicket.orderAmount?.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="flex-1 space-y-3">
            <div className="text-xs font-bold text-text-primary">
              Activity log
            </div>

            <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider text-xs">
              {selectedTicket.activityLogs.map((log, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white shadow-xs" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{log.author}</span>
                    <span className="text-[11px] font-mono text-text-secondary">{log.time}</span>
                  </div>
                  <p className="text-text-body2 mt-0.5 leading-relaxed">{log.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Log note textarea */}
          <form onSubmit={handleAddLogNote} className="space-y-2 pt-2 border-t border-divider">
            <div className="text-[11px] font-semibold text-text-secondary">
              Log note (ทุกคน / @แท็ก / แนบไฟล์)
            </div>
            <textarea
              rows={2}
              value={logNoteInput}
              onChange={(e) => setLogNoteInput(e.target.value)}
              placeholder="พิมพ์บันทึก... ใช้ @ เพื่อแท็กเพื่อนร่วมงาน"
              className="w-full p-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand resize-none bg-bg-app/40 focus:bg-white"
            />
            {logNoteInput.trim() && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 bg-brand text-white text-xs font-semibold rounded-md shadow-xs"
                >
                  บันทึก Note
                </button>
              </div>
            )}
          </form>

          {/* Action Buttons Bottom */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={handleSetReminder}
              className="py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium transition-colors"
            >
              ตั้งเตือน
            </button>
            <button
              onClick={handleEscalate}
              className="py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium transition-colors"
            >
              Escalate
            </button>
            <button
              onClick={handleCloseTicket}
              className="py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              ปิด Ticket
            </button>
          </div>

        </div>

      </div>

      {/* Modal: + สร้าง Ticket */}
      <Modal
        isOpen={isAddTicketModalOpen}
        onClose={() => setIsAddTicketModalOpen(false)}
        title="สร้าง Service Ticket ใหม่"
        footer={
          <>
            <button
              onClick={() => setIsAddTicketModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateTicketSubmit}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              สร้าง Ticket
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">ลูกค้า (CDP) *</label>
            <select
              value={newTicketForm.customerId}
              onChange={(e) => {
                const c = customers.find(x => x.id === e.target.value);
                setNewTicketForm({
                  ...newTicketForm,
                  customerId: e.target.value,
                  customerName: c ? c.name : 'ลูกค้า',
                  customerTier: c ? c.tier : 'MEMBER',
                });
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) · {c.tier}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">หัวข้อ Ticket *</label>
            <input
              type="text"
              required
              value={newTicketForm.title}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
              placeholder="เช่น เครื่องพิมพ์ขึ้น Error E-05"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">ประเภท / หมวด</label>
              <select
                value={newTicketForm.category}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="Complaint">Complaint (ร้องเรียน)</option>
                <option value="Inquiry">Inquiry (สอบถาม)</option>
                <option value="Claim">Claim (เคลมสินค้า)</option>
                <option value="Request">Request (คำร้องขอ)</option>
                <option value="Billing">Billing (บัญชี/ใบแจ้งหนี้)</option>
                <option value="Credit">Credit (สินเชื่อ)</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">ช่องทางรับเรื่อง</label>
              <select
                value={newTicketForm.channel}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, channel: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="LINE">LINE</option>
                <option value="Facebook">Facebook</option>
                <option value="3CX">3CX (โทรศัพท์)</option>
                <option value="Email">Email</option>
                <option value="Web form">Web form</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
