import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ContactPerson } from '../../types';
import { EMPTY_PERSON_NAME_DRAFT, PersonNameDraft, PersonNameFields } from './PersonNameFields';
import { formatPersonFullName, parseLegacyPersonName } from '../../domain/customer/personName';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: Omit<ContactPerson, 'id'>) => void;
  initialData?: ContactPerson | null;
}

const EMPTY_CONTACT_FIELDS = {
  roleOrTitle: '',
  phone: '',
  email: '',
  lineId: '',
  isPrimary: false,
  notes: '',
};

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [formData, setFormData] = useState(EMPTY_CONTACT_FIELDS);

  useEffect(() => {
    if (!initialData) {
      setPersonDraft(EMPTY_PERSON_NAME_DRAFT);
      setFormData(EMPTY_CONTACT_FIELDS);
      return;
    }
    const parsed = initialData.firstName
      ? {
          prefix: initialData.prefix || '',
          firstName: initialData.firstName,
          lastName: initialData.lastName || '',
        }
      : parseLegacyPersonName(initialData.name);

    setPersonDraft({
      prefix: parsed.prefix,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      nickname: initialData.nickname || '',
    });
    setFormData({
      roleOrTitle: initialData.roleOrTitle,
      phone: initialData.phone,
      email: initialData.email || '',
      lineId: initialData.lineId || '',
      isPrimary: initialData.isPrimary,
      notes: initialData.notes || '',
    });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = personDraft.firstName.trim();
    if (!firstName || !formData.phone.trim()) return;

    onSubmit({
      prefix: personDraft.prefix.trim() || undefined,
      firstName,
      lastName: personDraft.lastName.trim() || undefined,
      nickname: personDraft.nickname.trim() || undefined,
      name: formatPersonFullName(personDraft),
      roleOrTitle: formData.roleOrTitle.trim() || 'ผู้ติดต่อ',
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      lineId: formData.lineId.trim() || undefined,
      isPrimary: formData.isPrimary,
      notes: formData.notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'แก้ไขข้อมูลผู้ติดต่อ' : 'เพิ่มผู้ติดต่อใหม่ (Contact Person)'}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            บันทึกผู้ติดต่อ
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <PersonNameFields value={personDraft} onChange={setPersonDraft} firstNameRequired />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">ตำแหน่ง / แผนกงาน</label>
            <input
              type="text"
              value={formData.roleOrTitle}
              onChange={(e) => setFormData({ ...formData, roleOrTitle: e.target.value })}
              placeholder="เช่น ผู้จัดการฝ่ายจัดซื้อ, หัวหน้าบัญชี"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08x-xxx-xxxx หรือ 02-xxx-xxxx"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">อีเมลสำหรับติดต่อ</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@company.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">LINE ID</label>
            <input
              type="text"
              value={formData.lineId}
              onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
              placeholder="เช่น somchai_cb"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary font-medium mb-1">บันทึก / ขอบเขตอำนาจตัดสินใจ</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="เช่น ผู้มีอำนาจสั่งซื้อและลงนาม PO, วางบิลเฉพาะวันศุกร์"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary resize-none"
          />
        </div>

        <div className="pt-2 border-t border-divider">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
            />
            <span className="text-text-primary font-semibold">ตั้งเป็นผู้ติดต่อหลัก (Primary Contact)</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
