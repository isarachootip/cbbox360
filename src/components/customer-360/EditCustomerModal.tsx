import React, { useState, useEffect, useId } from 'react';
import { Check } from 'lucide-react';
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
import {
  CustomerFormErrors,
  validateEditCustomerInput,
} from '../../domain/customer/customerValidation';

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
  const formId = useId();
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
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
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
    const res = validateEditCustomerInput({
      customerType,
      personDraft,
      corpDraft,
      phone,
      email,
      birthday,
    });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    onSubmit(res.updates);
    onClose();
  };

  const inputBase =
    'w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white text-text-primary transition-all focus:outline-none focus:ring-2';
  const normalBorder = 'border-border focus:border-brand focus:ring-brand/20';
  const errorBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`แก้ไขข้อมูลลูกค้า (${customer.id})`}
      subtitle="อัปเดตข้อมูลชื่อ ช่องทางติดต่อ หรือข้อมูลนิติบุคคลในโปรไฟล์ Customer 360°"
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
            <span>บันทึกการแก้ไข</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        <CustomerTypeToggle
          value={customerType}
          onChange={(next) => {
            setCustomerType(next);
            setErrors({});
          }}
        />

        {customerType === 'INDIVIDUAL' ? (
          <PersonNameFields
            value={personDraft}
            onChange={(next) => {
              setPersonDraft(next);
              setErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            firstNameRequired
            firstNameError={errors.firstName}
          />
        ) : (
          <CorporateIdentityFields
            value={corpDraft}
            onChange={(next) => {
              setCorpDraft(next);
              setErrors((prev) => ({ ...prev, companyName: undefined, taxId: undefined }));
            }}
            companyNameError={errors.companyName}
            taxIdError={errors.taxId}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-divider">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              เบอร์โทรหลัก <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              className={`${inputBase} font-mono ${errors.phone ? errorBorder : normalBorder}`}
            />
            {errors.phone && <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">อีเมลติดต่อ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`${inputBase} ${errors.email ? errorBorder : normalBorder}`}
            />
            {errors.email && <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">วันเกิด</label>
            <input
              type="text"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="เช่น 14 ก.พ."
              className={`${inputBase} ${normalBorder}`}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
