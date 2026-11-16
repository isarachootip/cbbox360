import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  TierType,
  CreditGrade,
  Customer,
  CustomerType,
  CreateCustomerInput,
} from '../../types';
import {
  EMPTY_PERSON_NAME_DRAFT,
  PersonNameDraft,
  PersonNameFields,
} from '../customer-360/PersonNameFields';
import {
  CorporateDraft,
  CorporateIdentityFields,
  CustomerTypeToggle,
} from '../customer-360/CorporateIdentityFields';
import {
  CorporatePrimaryContactSection,
  CustomerTierCreditFields,
  buildCreateCustomerPayload,
} from './CustomerTierCreditFields';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onSubmit: (customerData: CreateCustomerInput) => Customer;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  initialPhone,
  onSubmit,
}) => {
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [corpDraft, setCorpDraft] = useState<CorporateDraft>({
    companyName: '',
    taxId: '',
    branchCode: '00000',
  });
  const [contactDraft, setContactDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<TierType>('MEMBER');
  const [creditGrade, setCreditGrade] = useState<CreditGrade>('B');
  const [creditLimit, setCreditLimit] = useState('50000');
  const [contactRole, setContactRole] = useState('ผู้จัดการฝ่ายจัดซื้อ');

  useEffect(() => {
    if (isOpen && initialPhone) setPhone(initialPhone);
  }, [isOpen, initialPhone]);

  const resetForm = () => {
    setPersonDraft(EMPTY_PERSON_NAME_DRAFT);
    setCorpDraft({ companyName: '', taxId: '', branchCode: '00000' });
    setContactDraft(EMPTY_PERSON_NAME_DRAFT);
    setPhone('');
    setEmail('');
    setTier('MEMBER');
    setCreditGrade('B');
    setCreditLimit('50000');
    setContactRole('ผู้จัดการฝ่ายจัดซื้อ');
    setCustomerType('INDIVIDUAL');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildCreateCustomerPayload({
      customerType,
      personDraft,
      corpDraft,
      contactDraft,
      contactRole,
      phone,
      email,
      tier,
      creditGrade,
      creditLimit,
    });
    if (!payload) return;

    onSubmit(payload);
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เพิ่มข้อมูลลูกค้าใหม่ใน CDP"
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
            บันทึกข้อมูล
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <CustomerTypeToggle value={customerType} onChange={setCustomerType} />

        {customerType === 'INDIVIDUAL' ? (
          <PersonNameFields value={personDraft} onChange={setPersonDraft} firstNameRequired />
        ) : (
          <CorporateIdentityFields value={corpDraft} onChange={setCorpDraft} />
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              เบอร์โทรหลัก <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08x-xxx-xxxx"
              className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">อีเมลติดต่อ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
              className="w-full px-3 py-2 border border-border rounded-lg text-xs"
            />
          </div>
        </div>

        {customerType === 'CORPORATE' && (
          <CorporatePrimaryContactSection
            contactRole={contactRole}
            onRoleChange={setContactRole}
            personDraft={contactDraft}
            onPersonChange={setContactDraft}
          />
        )}

        <CustomerTierCreditFields
          tier={tier}
          creditGrade={creditGrade}
          creditLimit={creditLimit}
          onTierChange={setTier}
          onGradeChange={setCreditGrade}
          onLimitChange={setCreditLimit}
        />
      </form>
    </Modal>
  );
};
