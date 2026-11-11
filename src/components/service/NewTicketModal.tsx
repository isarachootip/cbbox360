import React, { useState } from 'react';
import { ChannelType, Customer, Ticket, TierType } from '../../types';
import { Modal } from '../common/Modal';

export interface NewTicketPayload {
  customerId: string;
  customerName: string;
  customerTier: TierType;
  title: string;
  category: Ticket['category'];
  channel: ChannelType;
  status: Ticket['status'];
  slaFormatted: string;
  assignee: string;
}

interface NewTicketModalProps {
  isOpen: boolean;
  customers: Customer[];
  onClose: () => void;
  onCreate: (payload: NewTicketPayload) => void;
}

const CATEGORIES: { value: Ticket['category']; label: string }[] = [
  { value: 'Complaint', label: 'Complaint (ร้องเรียน)' },
  { value: 'Inquiry', label: 'Inquiry (สอบถาม)' },
  { value: 'Claim', label: 'Claim (เคลมสินค้า)' },
  { value: 'Request', label: 'Request (คำร้องขอ)' },
  { value: 'Billing', label: 'Billing (บัญชี/ใบแจ้งหนี้)' },
  { value: 'Credit', label: 'Credit (สินเชื่อ)' },
  { value: 'DSR', label: 'DSR (PDPA)' },
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
  onClose,
  onCreate,
}) => {
  const defaultCust = customers[0];
  const [customerId, setCustomerId] = useState<string>(defaultCust?.id || 'C00123');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Ticket['category']>('Complaint');
  const [channel, setChannel] = useState<ChannelType>('LINE');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const matchedCust = customers.find((c) => c.id === customerId) || defaultCust;
    onCreate({
      customerId: matchedCust.id,
      customerName: matchedCust.name,
      customerTier: matchedCust.tier,
      title: title.trim(),
      category,
      channel,
      status: 'Open',
      slaFormatted: '4 ชม.',
      assignee: 'วิภา ส.',
    });
    setTitle('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="สร้าง Service Ticket ใหม่"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            สร้าง Ticket
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-[13px]">
        <div>
          <label className="block text-xs text-text-secondary font-semibold mb-1">
            ลูกค้า (CDP) *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
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
          <label className="block text-xs text-text-secondary font-semibold mb-1">
            หัวข้อ Ticket *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เครื่องพิมพ์ขึ้น Error E-05 หรือติดตามสถานะจัดส่ง"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">
              ประเภท / หมวด
            </label>
            <select
              value={category}
              onChange={(e) => {
                const found = CATEGORIES.find((c) => c.value === e.target.value);
                if (found) setCategory(found.value);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">
              ช่องทางรับเรื่อง
            </label>
            <select
              value={channel}
              onChange={(e) => {
                const found = CHANNELS.find((ch) => ch.value === e.target.value);
                if (found) setChannel(found.value);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
            >
              {CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
