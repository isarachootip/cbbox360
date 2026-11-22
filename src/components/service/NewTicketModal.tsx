import React, { useEffect, useState } from 'react';
import { ChannelType, Customer, TicketPriority } from '../../types';
import { Modal } from '../common/Modal';
import { useTenantRuntime } from '../../../core/client/providers/TenantRuntimeContext';
import { useAuth } from '../../context/AuthContext';
import { CASE_PRIORITY_OPTIONS } from '../../domain/cases/caseMetrics';
import {
  CASE_CHANNEL_OPTIONS,
  CaseFieldServiceInputs,
  EMPTY_FIELD_SERVICE,
  FALLBACK_CASE_CATEGORIES,
  FieldServiceValues,
  NewTicketPayload,
} from './CaseFieldServiceInputs';

export type { NewTicketPayload };

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
  const { users } = useAuth();
  const activeAssignees = Array.from(
    new Set([defaultAssignee, ...users.filter((u) => u.status === 'active').map((u) => u.name)].filter(Boolean))
  );
  const categoryOptions =
    caseCategories.length > 0 ? caseCategories.map((c) => c.name) : FALLBACK_CASE_CATEGORIES;

  const defaultCust = customers[0];
  const [customerId, setCustomerId] = useState<string>(initialCustomerId || defaultCust?.id || '');
  const [title, setTitle] = useState<string>(initialTitle);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(categoryOptions[0] || 'Inquiry');
  const [systemName, setSystemName] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [channel, setChannel] = useState<ChannelType>(initialChannel);
  const [assignee, setAssignee] = useState<string>(defaultAssignee);
  const [externalTicketId, setExternalTicketId] = useState<string>('');
  const [fieldService, setFieldService] = useState<FieldServiceValues>(EMPTY_FIELD_SERVICE);

  useEffect(() => {
    if (!isOpen) return;
    setCustomerId(initialCustomerId || customers[0]?.id || '');
    setChannel(initialChannel);
    setTitle(initialTitle);
    setCategory(categoryOptions[0] || 'Inquiry');
    setAssignee(defaultAssignee);
    setDescription('');
    setSystemName('');
    setPriority('Normal');
    setExternalTicketId('');
    setFieldService(EMPTY_FIELD_SERVICE);
  }, [isOpen, initialCustomerId, initialChannel, initialTitle, defaultAssignee]);

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
      serviceMode: fieldService.serviceMode,
      assetSerial: fieldService.assetSerial.trim() || undefined,
      siteLocation: fieldService.siteLocation.trim() || undefined,
      reporterName: fieldService.reporterName.trim() || undefined,
      reporterPhone: fieldService.reporterPhone.trim() || undefined,
      priority,
      channel,
      status: 'Open',
      slaFormatted: priority === 'Critical' ? '2 ชม.' : priority === 'High' ? '4 ชม.' : '8 ชม.',
      assignee: assignee || defaultAssignee,
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
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white cursor-pointer">ยกเลิก</button>
          <button type="button" onClick={() => handleSubmit()} className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer">เปิด Case</button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[13px] max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ลูกค้า / องค์กร *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium text-xs">
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.id})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ผู้รับผิดชอบ (Assignee)</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-xs">
              {activeAssignees.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">หัวข้อปัญหา / คำร้อง *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ระบบ ERP ออกใบแจ้งหนี้ไม่ได้ หรือเครื่องพิมพ์ขึ้น Error" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">หมวดเคส</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-xs">
              {categoryOptions.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ระดับความเร่งด่วน</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-xs">
              {CASE_PRIORITY_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ระบบงาน / อุปกรณ์</label>
            <input type="text" value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder="เช่น ERP Billing, POS" className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand text-xs" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">ช่องทางรับเรื่อง</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)} className="w-full px-2.5 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-xs">
              {CASE_CHANNEL_OPTIONS.map((ch) => (<option key={ch.value} value={ch.value}>{ch.label}</option>))}
            </select>
          </div>
        </div>

        <CaseFieldServiceInputs values={fieldService} onChange={setFieldService} />

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">รายละเอียดเพิ่มเติม</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ระบุอาการ Error หรือช่วงเวลาที่พบปัญหา..." className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand resize-none text-xs" />
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">เลขอ้างอิง Helpdesk เดิม (ไม่บังคับ · Phase 2)</label>
          <input type="text" value={externalTicketId} onChange={(e) => setExternalTicketId(e.target.value)} placeholder="เช่น HD-90412" className="w-full px-3 py-1.5 font-mono text-xs border border-border rounded-lg focus:outline-none focus:border-brand" />
        </div>
      </form>
    </Modal>
  );
};
