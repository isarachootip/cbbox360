import React from 'react';
import { Modal } from '../common/Modal';
import { AgentSkillsFieldset } from './AgentSkillsFieldset';
import { AgentSkill, UserAccount, UserRole } from '../../types';

export interface UserFormValues {
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  skills: AgentSkill[];
  extension: string;
  status: 'active' | 'inactive';
  avatarBg: string;
  mustChangePassword: boolean;
}

interface UserFormModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  values: UserFormValues;
  onChange: (next: UserFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  canAssignSysAdmin: boolean;
  editingUsername?: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'sysadmin', label: 'sysadmin (System Administrator)' },
  { value: 'admin', label: 'admin (Administrator)' },
  { value: 'SF_1', label: 'SF_1 (Sales Force - Sales/Pipeline)' },
  { value: 'SF_2', label: 'SF_2 (Sales Force - Service/Inbox)' },
  { value: 'SF_3', label: 'SF_3 (Sales Force - Credit Sales)' },
  { value: 'supervisor', label: 'supervisor (Supervisor)' },
  { value: 'doctor', label: 'doctor (แพทย์)' },
  { value: 'nurse', label: 'nurse (พยาบาล)' },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  mode,
  isOpen,
  onClose,
  values,
  onChange,
  onSubmit,
  isSubmitting,
  canAssignSysAdmin,
  editingUsername,
}) => {
  const isCreate = mode === 'create';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'เพิ่มบัญชีผู้ใช้งานใหม่ (Create New User)' : `แก้ไขข้อมูลผู้ใช้: ${editingUsername ?? ''}`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {isSubmitting ? 'กำลังบันทึก...' : isCreate ? 'บันทึกสร้างผู้ใช้' : 'บันทึกการแก้ไข'}
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <div className={isCreate ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label className="block text-text-secondary font-medium mb-1">ชื่อผู้ใช้ (Username) *</label>
            <input
              type="text"
              required
              value={values.username}
              onChange={(e) => onChange({ ...values, username: e.target.value })}
              placeholder="เช่น tumtum, SF_4"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
            />
          </div>
          {isCreate && (
            <div>
              <label className="block text-text-secondary font-medium mb-1">รหัสผ่าน (Password) *</label>
              <input
                type="text"
                required
                value={values.password}
                onChange={(e) => onChange({ ...values, password: e.target.value })}
                placeholder="เช่น 1234"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
          )}
        </div>

        {isCreate && (
          <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary">
            <input
              type="checkbox"
              checked={values.mustChangePassword}
              onChange={(e) => onChange({ ...values, mustChangePassword: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand"
            />
            <span>บังคับให้ผู้ใช้ตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก (ปล่อยว่างเพื่อให้เข้าใช้งานด้วยรหัสนี้ได้ทันที)</span>
          </label>
        )}

        <div>
          <label className="block text-text-secondary font-medium mb-1">ชื่อ-นามสกุล (Full Name) *</label>
          <input
            type="text"
            required
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            placeholder="เช่น ณัฐวุฒิ สิทธิชัย"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-text-secondary font-medium mb-1">อีเมล (Email)</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
            placeholder="user@cb360.co.th"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">บทบาท (Role) *</label>
            <select
              value={values.role}
              onChange={(e) => onChange({ ...values, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === 'sysadmin' && !canAssignSysAdmin}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">สถานะ (Status)</label>
            <select
              value={values.status}
              onChange={(e) => onChange({ ...values, status: e.target.value as UserAccount['status'] })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
            >
              <option value="active">Active (เปิดใช้งาน)</option>
              <option value="inactive">Inactive (ระงับชั่วคราว)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-text-secondary font-medium mb-1">แผนก / ฝ่ายงาน (Department)</label>
          <input
            type="text"
            value={values.department}
            onChange={(e) => onChange({ ...values, department: e.target.value })}
            placeholder="เช่น ฝ่ายพัฒนาธุรกิจและการขาย"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
          />
        </div>

        <AgentSkillsFieldset
          skills={values.skills}
          extension={values.extension}
          onChange={(skills, extension) => onChange({ ...values, skills, extension })}
        />
      </form>
    </Modal>
  );
};
