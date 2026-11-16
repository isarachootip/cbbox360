import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer, CustomerType, UpdateCustomerInput } from '../../types';
import {
  EMPTY_PERSON_NAME_DRAFT,
  PersonNameDraft,
  PersonNameFields,
} from './PersonNameFields';
import {
  CorporateDraft,
  CorporateIdentityFields,
  CustomerTypeToggle,
} from './CorporateIdentityFields';
import { parseLegacyPersonName } from '../../domain/customer/personName';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer;
  onClose: () => void;
  onSubmit: (updates: UpdateCustomerInput) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit,
}) => {
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [corpDraft, setCorpDraft] = useState<CorporateDraft>({
    companyName: '',
    taxId: '',
    branchCode: '00000',
  });
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCustomerType(customer.customerType || 'INDIVIDUAL');

    const parsed = customer.firstName
      ? {
          prefix: customer.prefix || '',
          firstName: customer.firstName,
          lastName: customer.lastName || '',
        }
      : parseLegacyPersonName(customer.name);

    setPersonDraft({
      prefix: parsed.prefix,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      nickname: customer.nickname || '',
    });
    setCorpDraft({
      companyName: customer.companyName || customer.name,
      taxId: customer.taxId || '',
      branchCode: customer.branchCode || '00000',
    });
    setPhone(customer.fullPhone || customer.phone);
    setEmail(customer.email || '');
    setBirthday(customer.birthday === '-' ? '' : customer.birthday);
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    if (customerType === 'CORPORATE') {
      if (!corpDraft.companyName.trim()) return;
      onSubmit({
        customerType: 'CORPORATE',
        companyName: corpDraft.companyName.trim(),
        taxId: corpDraft.taxId.trim(),
        branchCode: corpDraft.branchCode.trim(),
        phone: phone.trim(),
        fullPhone: phone.trim(),
        email: email.trim(),
        birthday: birthday.trim() || '-',
      });
    } else {
      if (!personDraft.firstName.trim()) return;
      onSubmit({
        customerType: 'INDIVIDUAL',
        prefix: personDraft.prefix.trim(),
        firstName: personDraft.firstName.trim(),
        lastName: personDraft.lastName.trim(),
        nickname: personDraft.nickname.trim(),
        phone: phone.trim(),
        fullPhone: phone.trim(),
        email: email.trim(),
        birthday: birthday.trim() || '-',
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`แก้ไขข้อมูลลูกค้า (${customer.id})`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-subtle transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            บันทึกการแก้ไข
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <CustomerTypeToggle value={customerType} onChange={setCustomerType} />

        {customerType === 'INDIVIDUAL' ? (
          <PersonNameFields value={personDraft} onChange={setPersonDraft} firstNameRequired />
        ) : (
          <CorporateIdentityFields value={corpDraft} onChange={setCorpDraft} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              เบอร์โทรหลัก <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">อีเมลติดต่อ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">วันเกิด</label>
            <input
              type="text"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="เช่น 14 ก.พ."
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
