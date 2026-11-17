import React, { useId, useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { ConsentSource, Customer, DsrRequestType } from '../../types';
import { DSR_REQUEST_TYPE_META } from '../../data/consent';

interface NewDsrModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSubmit: (input: {
    customer: Customer;
    requestType: DsrRequestType;
    channel: ConsentSource;
    reason: string;
    assignee: string;
  }) => void;
}

const CHANNELS: ConsentSource[] = [
  'LINE LIFF',
  'Web Form',
  'Email',
  '3CX Call',
  'Walk-in',
];

export const NewDsrModal: React.FC<NewDsrModalProps> = ({
  isOpen,
  onClose,
  customers,
  onSubmit,
}) => {
  const formId = useId();
  const [customerId, setCustomerId] = useState(customers[0]?.id || 'C00123');
  const [requestType, setRequestType] = useState<DsrRequestType>('WITHDRAW_CONSENT');
  const [channel, setChannel] = useState<ConsentSource>('LINE LIFF');
  const [assignee, setAssignee] = useState('สมศักดิ์ บ. (DPO)');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCustomerId(customers[0]?.id || 'C00123');
    setReason('');
    setReasonError('');
  }, [isOpen, customers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError('กรุณาระบุรายละเอียดหรือเหตุผลของคำขอใช้สิทธิ์');
      return;
    }
    const customer = customers.find((c) => c.id === customerId) || customers[0];
    if (!customer) return;
    onSubmit({ customer, requestType, channel, reason, assignee });
    onClose();
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="รับคำขอใช้สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล (DSR Request)"
      subtitle="บันทึกคำขอตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 พร้อมกำหนดเวลา SLA 30 วัน"
      maxWidth="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form={formId}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold shadow-card transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกคำขอ DSR</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              เลือกลูกค้าในระบบ CDP <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputClass}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              ประเภทสิทธิ์ที่ขอใช้ <span className="text-rose-500">*</span>
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as DsrRequestType)}
              className={inputClass}
            >
              {(Object.keys(DSR_REQUEST_TYPE_META) as DsrRequestType[]).map((key) => (
                <option key={key} value={key}>
                  {DSR_REQUEST_TYPE_META[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-bg-subtle border border-border text-xs text-text-secondary">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <span>
            <strong className="text-text-primary">ผลการทำงานอัตโนมัติเมื่อกดปิดงาน:</strong>{' '}
            {DSR_REQUEST_TYPE_META[requestType].description}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              ช่องทางที่ลูกค้ายื่นคำขอ
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ConsentSource)}
              className={inputClass}
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              ผู้รับผิดชอบตรวจสอบ (DPO / Admin)
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            รายละเอียด / เหตุผลของคำขอ <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
            placeholder="ระบุความต้องการของลูกค้า เช่น ขอถอนความยินยอมรับโปรโมชั่นทาง LINE และ SMS..."
            className={`${inputClass} resize-none ${reasonError ? 'border-rose-400' : ''}`}
          />
          {reasonError && (
            <p className="mt-1 text-xs font-medium text-rose-600">{reasonError}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};
