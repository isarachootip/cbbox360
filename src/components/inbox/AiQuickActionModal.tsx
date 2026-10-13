import React, { useState, useEffect } from 'react';
import { X, Ticket as TicketIcon, Briefcase, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Customer, Ticket } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { useToast } from '../../context/ToastContext';

interface AiQuickActionModalProps {
  isOpen: boolean;
  mode: 'ticket' | 'lead';
  customer: Customer;
  initialTitle: string;
  initialTicketType?: string;
  initialEstValue?: number | null;
  onClose: () => void;
}

const mapTicketCategory = (rawType = ''): Ticket['category'] => {
  const lower = rawType.toLowerCase();
  if (lower.includes('claim') || lower.includes('เคลม')) return 'Claim';
  if (lower.includes('complaint') || lower.includes('ร้องเรียน')) return 'Complaint';
  if (lower.includes('billing') || lower.includes('บิล')) return 'Billing';
  if (lower.includes('credit') || lower.includes('เครดิต')) return 'Credit';
  if (lower.includes('pdpa') || lower.includes('dsr')) return 'DSR';
  if (lower.includes('request')) return 'Request';
  return 'Inquiry';
};

export const AiQuickActionModal: React.FC<AiQuickActionModalProps> = ({
  isOpen,
  mode,
  customer,
  initialTitle,
  initialTicketType = 'Inquiry',
  initialEstValue = 50000,
  onClose,
}) => {
  const navigate = useNavigate();
  const { addTicket, addDeal } = useCustomer();
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialTitle);
  const [ticketCategory, setTicketCategory] = useState<Ticket['category']>(
    mapTicketCategory(initialTicketType)
  );
  const [assignee, setAssignee] = useState('วิภา ส.');
  const [leadValue, setLeadValue] = useState<number>(initialEstValue || 50000);

  useEffect(() => {
    setTitle(initialTitle);
    setTicketCategory(mapTicketCategory(initialTicketType));
    setLeadValue(initialEstValue || 50000);
  }, [initialTitle, initialTicketType, initialEstValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent, goAfterSave = false) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (mode === 'ticket') {
      addTicket({
        customerId: customer.id,
        customerName: customer.name,
        customerTier: customer.tier,
        title: title.trim(),
        category: ticketCategory,
        channel: 'LINE',
        status: 'Open',
        slaHoursLeft: customer.tier === 'PLATINUM' ? 2 : 4,
        slaFormatted: customer.tier === 'PLATINUM' ? '2 ชม.' : '4 ชม.',
        slaStatus: 'normal',
        assignee,
        orderRef: customer.lastOrderCode,
        orderAmount: customer.lastOrderAmount,
      });
      showToast(`สร้าง Ticket "${title.trim()}" จาก AI Summary สำเร็จ`, 'success');
      onClose();
      if (goAfterSave) navigate('/cases');
    } else {
      addDeal({
        customerId: customer.id,
        customerName: customer.name,
        title: title.trim(),
        value: Number(leadValue) || 0,
        stage: 'Lead',
        probability: 20,
        ownerName: assignee,
        ownerInitials: assignee.slice(0, 2),
        source: 'LINE',
        daysInStage: 0,
      });
      showToast(`สร้าง Lead "${title.trim()}" จาก AI Summary สำเร็จ`, 'success');
      onClose();
      if (goAfterSave) navigate('/pipeline');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-bg-subtle">
          <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
            {mode === 'ticket' ? (
              <TicketIcon className="w-4 h-4 text-brand" />
            ) : (
              <Briefcase className="w-4 h-4 text-brand" />
            )}
            <span>
              {mode === 'ticket'
                ? '✨ สร้าง Ticket ใหม่ (กรอกข้อมูลจาก AI Summary)'
                : '✨ สร้าง Lead ใหม่ (กรอกข้อมูลจาก AI Summary)'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-[11px] bg-bg-app px-3 py-2 rounded-lg border border-border">
            <span className="text-text-secondary">ลูกค้า:</span>
            <span className="font-bold text-text-primary">
              {customer.name} ({customer.tier})
            </span>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              หัวข้อรายการ (Title)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
              required
            />
          </div>

          {mode === 'ticket' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-text-primary mb-1">หมวดหมู่ Ticket</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as Ticket['category'])}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
                >
                  <option value="Inquiry">Inquiry (สอบถาม)</option>
                  <option value="Claim">Claim (เคลมสินค้า)</option>
                  <option value="Complaint">Complaint (ร้องเรียน)</option>
                  <option value="Billing">Billing (การเงิน/บิล)</option>
                  <option value="Credit">Credit (สินเชื่อ)</option>
                  <option value="Request">Request (คำร้องทั่วไป)</option>
                  <option value="DSR">DSR (สิทธิ PDPA)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-text-primary mb-1">ผู้รับผิดชอบ</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  มูลค่าประเมิน (บาท)
                </label>
                <input
                  type="number"
                  value={leadValue}
                  onChange={(e) => setLeadValue(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg font-mono focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block font-semibold text-text-primary mb-1">ผู้ดูแล Deal</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-3 py-1.5 rounded-lg border border-brand text-brand hover:bg-bg-subtle font-semibold flex items-center gap-1"
            >
              <span>บันทึก & เปิดหน้างาน</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold"
            >
              บันทึกทันที
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
