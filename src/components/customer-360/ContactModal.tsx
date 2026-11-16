import React, { useState, useEffect, useId } from 'react';
import { Check } from 'lucide-react';
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
  const formId = useId();
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [formData, setFormData] = useState(EMPTY_CONTACT_FIELDS);
  const [errors, setErrors] = useState<{ firstName?: string; phone?: string }>({});

  useEffect(() => {
    setErrors({});
    if (!initialData) {
      setPersonDraft(EMPTY_PERSON_NAME_DRAFT);
      setFormData(EMPTY_CONTACT_FIELDS);
      return;
    }
    const parsed = initialData.firstName
      ? { prefix: initialData.prefix || '', firstName: initialData.firstName, lastName: initialData.lastName || '' }
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
    const cleanPhone = formData.phone.trim();
    const nextErrors: { firstName?: string; phone?: string } = {};
    if (!firstName) nextErrors.firstName = 'กรุณาระบุชื่อผู้ติดต่อ';
    if (!cleanPhone) nextErrors.phone = 'กรุณาระบุเบอร์โทรศัพท์ผู้ติดต่อ';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      prefix: personDraft.prefix.trim() || undefined,
      firstName,
      lastName: personDraft.lastName.trim() || undefined,
      nickname: personDraft.nickname.trim() || undefined,
      name: formatPersonFullName(personDraft),
      roleOrTitle: formData.roleOrTitle.trim() || 'ผู้ติดต่อ',
      phone: cleanPhone,
      email: formData.email.trim() || undefined,
      lineId: formData.lineId.trim() || undefined,
      isPrimary: formData.isPrimary,
      notes: formData.notes.trim() || undefined,
    });
    onClose();
  };

  const inputBase =
    'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'แก้ไขข้อมูลผู้ติดต่อ' : 'เพิ่มผู้ติดต่อใหม่ (Contact Person)'}
      subtitle="บันทึกผู้ประสานงาน ตำแหน่ง และช่องทางติดต่อของลูกค้า"
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
            <span>บันทึกผู้ติดต่อ</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        <PersonNameFields
          value={personDraft}
          onChange={(next) => {
            setPersonDraft(next);
            if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
          }}
          firstNameRequired
          firstNameError={errors.firstName}
          autoFocusFirstName={isOpen && !initialData}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">ตำแหน่ง / แผนกงาน</label>
            <input
              type="text"
              value={formData.roleOrTitle}
              onChange={(e) => setFormData({ ...formData, roleOrTitle: e.target.value })}
              placeholder="เช่น ผู้จัดการฝ่ายจัดซื้อ, หัวหน้าบัญชี"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="08x-xxx-xxxx หรือ 02-xxx-xxxx"
              className={`${inputBase} font-mono ${errors.phone ? 'border-rose-400' : ''}`}
            />
            {errors.phone && <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">อีเมลสำหรับติดต่อ</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@company.com"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">LINE ID</label>
            <input
              type="text"
              value={formData.lineId}
              onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
              placeholder="เช่น somchai_cb"
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">บันทึก / ขอบเขตอำนาจตัดสินใจ</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="เช่น ผู้มีอำนาจสั่งซื้อและลงนาม PO, วางบิลเฉพาะวันศุกร์"
            className={`${inputBase} resize-none`}
          />
        </div>

        <div className="pt-2.5 border-t border-divider">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
            />
            <span className="text-sm text-text-primary font-semibold">ตั้งเป็นผู้ติดต่อหลัก (Primary Contact)</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
