import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserAccount } from '../../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  newPassword: string;
  onPasswordChange: (val: string) => void;
  mustChangePassword: boolean;
  onMustChangeToggle: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  newPassword,
  onPasswordChange,
  mustChangePassword,
  onMustChangeToggle,
  onSubmit,
  isSubmitting,
}) => {
  const [showPassword, setShowPassword] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`รีเซ็ตรหัสผ่านสำหรับ: ${user?.username ?? ''}`}
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
            onClick={onSubmit}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันเปลี่ยนรหัสผ่าน'}
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <p className="text-text-secondary">
          กำหนดรหัสผ่านใหม่สำหรับผู้ใช้ <strong>{user?.name}</strong> ({user?.username})
        </p>

        <div>
          <label className="block text-text-secondary font-medium mb-1">รหัสผ่านใหม่ (New Password) *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่ เช่น 1234"
              className="w-full px-3 py-2 pr-9 border border-border rounded-lg focus:outline-none focus:border-brand font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] text-text-secondary">ตั้งค่าด่วน:</span>
            <button
              type="button"
              onClick={() => onPasswordChange('1234')}
              className="text-xs px-2 py-0.5 rounded bg-bg-subtle border border-border text-brand font-mono font-bold hover:bg-brand-tint"
            >
              ใช้รหัส 1234
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary pt-1">
          <input
            type="checkbox"
            checked={mustChangePassword}
            onChange={(e) => onMustChangeToggle(e.target.checked)}
            className="rounded border-border text-brand focus:ring-brand"
          />
          <span>บังคับให้ผู้ใช้ตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก</span>
        </label>
      </form>
    </Modal>
  );
};
