import React from 'react';
import { Modal } from '../common/Modal';
import { UserAccount } from '../../types';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isSubmitting,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="ยืนยันการลบบัญชีผู้ใช้"
    maxWidth="sm"
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
          disabled={isSubmitting}
          onClick={onConfirm}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบผู้ใช้'}
        </button>
      </>
    }
  >
    <div className="space-y-3 text-xs">
      <p className="text-text-primary">
        คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ <strong>{user?.name}</strong> (
        <span className="font-mono">{user?.username}</span>)?
      </p>
      <div className="p-3 bg-danger-bg border border-danger-border rounded-lg text-danger-text text-[11px]">
        การลบจะยกเลิกเซสชันทั้งหมดทันทีและผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้อีกต่อไป
      </div>
    </div>
  </Modal>
);
