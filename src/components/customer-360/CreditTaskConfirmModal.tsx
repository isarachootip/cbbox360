import React from 'react';
import { Modal } from '../common/Modal';
import type { Customer } from '../../types';

interface CreditTaskConfirmModalProps {
  isOpen: boolean;
  customer: Customer;
  onClose: () => void;
  onConfirm: () => void;
}

export const CreditTaskConfirmModal: React.FC<CreditTaskConfirmModalProps> = ({
  isOpen,
  customer,
  onClose,
  onConfirm,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="สร้าง Task พิจารณาเพิ่มวงเงินให้ทีมสินเชื่อ"
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
          onClick={onConfirm}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          ยืนยันสร้าง Task
        </button>
      </>
    }
  >
    <div className="space-y-3 text-[13px]">
      <p className="text-text-secondary">
        ส่งคำขอสร้าง Ticket ในโมดูล Credit Sales &amp; Service เพื่อให้ผู้รับผิดชอบตรวจสอบและปรับวงเงิน
      </p>
      <div className="bg-bg-subtle p-3.5 rounded-xl border border-border space-y-1.5 font-mono text-xs tabular-nums">
        <div>
          ลูกค้า: <strong>{customer.name}</strong> ({customer.id})
        </div>
        <div>
          วงเงินปัจจุบัน: <strong>฿{customer.creditLimit.toLocaleString()}</strong>
        </div>
        <div>
          วงเงินที่เสนอใหม่: <strong className="text-emerald-700">฿400,000</strong>
        </div>
      </div>
    </div>
  </Modal>
);
