import React from 'react';
import { Modal } from '../common/Modal';
import { CannedResponse } from '../../types';

interface CannedResponseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: CannedResponse | null;
}

export const CannedResponseDeleteModal: React.FC<CannedResponseDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการลบข้อความตอบกลับอัตโนมัติ"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <p className="font-bold">คุณต้องการลบข้อความนี้ใช่หรือไม่?</p>
          <p className="font-mono text-text-primary">
            Shortcut: <strong>{item?.shortcut}</strong> ({item?.title})
          </p>
          <p className="text-[11px] text-rose-600">
            เมื่อลบแล้ว แอดมินจะไม่สามารถเรียกใช้ข้อความนี้ผ่านคีย์ลัดได้อีก
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-bg-subtle text-text-secondary rounded-lg text-xs font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </Modal>
  );
};
