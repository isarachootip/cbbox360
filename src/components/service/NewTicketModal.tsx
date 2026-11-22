import React, { useEffect, useState } from 'react';
import { ChannelType, Customer, Ticket, TicketPriority, TierType } from '../../types';
import { Modal } from '../common/Modal';
import { useTenantRuntime } from '../../../core/client/providers/TenantRuntimeContext';
import { CASE_PRIORITY_OPTIONS } from '../../domain/cases/caseMetrics';

export interface NewTicketPayload {
  customerId: string;
  customerName: string;
  customerTier: TierType;
  title: string;
  description?: string;
  category: string;
  systemName?: string;
  priority: TicketPriority;
  channel: ChannelType;
  status: Ticket['status'];
  slaFormatted: string;
  assignee: string;
  conversationId?: string;
  externalTicketId?: string;
}

interface NewTicketModalProps {
  isOpen: boolean;
  customers: Customer[];
  initialCustomerId?: string;
  initialChannel?: ChannelType;
  initialTitle?: string;
  conversationId?: string;
  defaultAssignee?: string;
  onClose: () => void;
  onCreate: (payload: NewTicketPayload) => void;
}

const FALLBACK_CATEGORIES = [
  'แจ้งปัญหา / Error ระบบงาน',
  'ระบบล่ม / ใช้งานไม่ได้',
  'สอบถามการใช้งานระบบ (How-to)',
  'แจ้งซ่อม / ตรวจเช็คอุปกรณ์',
  'Complaint',
  'Inquiry',
  'Request',
];

const CHANNELS: { value: ChannelType; label: string }[] = [
  { value: 'LINE', label: 'LINE' },
  { value: 'Facebook', label: 'Facebook' },
  { value: '3CX', label: '3CX (โทรศัพท์)' },
  { value: 'Email', label: 'Email' },
  { value: 'Web form', label: 'Web form' },
];

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  customers,
  initialCustomerId,
  initialChannel = 'LINE',
  initialTitle = '',
  conversationId,
  defaultAssignee = 'ทีม Helpdesk',
  onClose,
  onCreate,
}) => {
  const { caseCategories } = useTenantRuntime();
  const categoryOptions =
    caseCategories.length > 0 ? caseCategories.map((c) => c.name) : FALLBACK_CATEGORIES;

  const defaultCust = customers[0];
  const [customerId, setCustomerId] = useState<string>(initialCustomerId || defaultCust?.id || '');
  const [title, setTitle] = useState<string>(initialTitle);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(categoryOptions[0] || 'Inquiry');
  const [systemName, setSystemName] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [channel, setChannel] = useState<ChannelType>(initialChannel);
  const [externalTicketId, setExternalTicketId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setCustomerId(initialCustomerId || customers[0]?.id || '');
    setChannel(initialChannel);
    setTitle(initialTitle);
    setCategory(categoryOptions[0] || 'Inquiry');
    setDescription('');
    setSystemName('');
    setPriority('Normal');
    setExternalTicketId('');
  }, [isOpen, initialCustomerId, initialChannel, initialTitle]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const matchedCust = customers.find((c) => c.id === customerId) || defaultCust;
    if (!matchedCust) return;

    onCreate({
      customerId: matchedCust.id,
      customerName: matchedCust.name,
      customerTier: matchedCust.tier,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      systemName: systemName.trim() || undefined,
      priority,
      channel,
      status: 'Open',
      slaFormatted: priority === 'Critical' ? '2 ชม.' : priority === 'High' ? '4 ชม.' : '8 ชม.',
      assignee: defaultAssignee,
      conversationId,
      externalTicketId: externalTicketId.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เปิดเคสบริการ / แจ้งปัญหาใหม่"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white cursor-pointer">
            ยกเลิก
          </button>
          <button type="button" onClick={() => handleSubmit()} className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer">
            เปิด Case
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[13px]">
        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">ลูกค้า / ผู้แจ้ง *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium">
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id}) · {c.tier}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">หัวข้อปัญหา / คำร้อง *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ระบบ ERP ออกใบแจ้งหนี้ไม่ได้ หรือเครื่องพิมพ์ขึ้น Error" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">หมวดเคส</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white">
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ระดับความเร่งด่วน</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white">
              {CASE_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ระบบงาน / อุปกรณ์</label>
            <input type="text" value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder="เช่น ERP Billing, POS, Scanner" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ช่องทางรับเรื่อง</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white">
              {CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>{ch.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">รายละเอียดเพิ่มเติม</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ระบุอาการ Error, ช่วงเวลาที่พบปัญหา หรือชื่อผู้ใช้งาน..." className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand resize-none" />
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">เลขอ้างอิง Helpdesk เดิม (ไม่บังคับ · เผื่อ Link Phase 2)</label>
          <input type="text" value={externalTicketId} onChange={(e) => setExternalTicketId(e.target.value)} placeholder="เช่น HD-90412 หรือ INC-2026-01" className="w-full px-3 py-2 font-mono text-xs border border-border rounded-lg focus:outline-none focus:border-brand" />
        </div>
      </form>
    </Modal>
  );
};
