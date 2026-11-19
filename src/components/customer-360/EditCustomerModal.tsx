import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Customer, CustomerType, UpdateCustomerInput } from '../../types';
import { EMPTY_PERSON_NAME_DRAFT, PersonNameDraft, PersonNameFields } from './PersonNameFields';
import { CorporateDraft, CorporateIdentityFields, CustomerTypeToggle } from './CorporateIdentityFields';
import { ModalCustomFieldsSection } from '../customer-list/ModalCustomFieldsSection';
import { parseLegacyPersonName } from '../../domain/customer/personName';
import { CustomerFormErrors, validateEditCustomerInput } from '../../domain/customer/customerValidation';
import { useLabel } from '../../../core/client/hooks/useLabel';
import { useEntitlement } from '../../../core/client/hooks/useEntitlement';
import { useContactCustomFields } from '../../../core/client/hooks/useContactCustomFields';

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
  const { contactLabel } = useLabel();
  const { isEntitled } = useEntitlement();
  const isCommercialB2B = isEntitled('module:credit-sales');
  const cf = useContactCustomFields(customer.id);

  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [corpDraft, setCorpDraft] = useState<CorporateDraft>({ companyName: '', taxId: '', branchCode: '00000' });
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [customDraft, setCustomDraft] = useState<Record<string, unknown>>({});
  const [cfError, setCfError] = useState<string | null>(null);
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setCfError(null);
    setCustomerType(isCommercialB2B ? customer.customerType || 'INDIVIDUAL' : 'INDIVIDUAL');

    const parsed = customer.firstName
      ? { prefix: customer.prefix || '', firstName: customer.firstName, lastName: customer.lastName || '' }
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
    setEmail(customer.email === '-' ? '' : customer.email || '');
    setBirthday(customer.birthday === '-' ? '' : customer.birthday);
    setCustomDraft({ ...cf.values });
  }, [customer, isOpen, isCommercialB2B, cf.values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfError(null);
    const res = validateEditCustomerInput({
      customerType: isCommercialB2B ? customerType : 'INDIVIDUAL',
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

    if (cf.definitions.length > 0) {
      const savedCf = await cf.saveValues(customDraft);
      if (!savedCf.ok) {
        setCfError(savedCf.error || 'บันทึกข้อมูลเพิ่มเติมไม่สำเร็จ');
        return;
      }
    }

    onSubmit(res.updates);
    onClose();
  };

  const inputBase = 'w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white text-text-primary transition-all focus:outline-none focus:ring-2';
  const normalBorder = 'border-border focus:border-brand focus:ring-brand/20';
  const errorBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`แก้ไขข้อมูล${contactLabel} (${customer.id})`}
      subtitle={`อัปเดตข้อมูลชื่อ ช่องทางติดต่อ และรายละเอียดของ${contactLabel}`}
      maxWidth="2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" form={formId} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold shadow-card cursor-pointer">
            <Check className="w-4 h-4" />
            <span>บันทึกการแก้ไข</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        {isCommercialB2B && (
          <CustomerTypeToggle value={customerType} onChange={(next) => { setCustomerType(next); setErrors({}); }} />
        )}

        {cfError && (
          <div role="alert" className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-rose-200 bg-danger-bg text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{cfError}</span>
          </div>
        )}

        {!isCommercialB2B || customerType === 'INDIVIDUAL' ? (
          <PersonNameFields
            value={personDraft}
            onChange={(next) => { setPersonDraft(next); setErrors((prev) => ({ ...prev, firstName: undefined })); }}
            firstNameRequired
            firstNameError={errors.firstName}
          />
        ) : (
          <CorporateIdentityFields
            value={corpDraft}
            onChange={(next) => { setCorpDraft(next); setErrors((prev) => ({ ...prev, companyName: undefined, taxId: undefined })); }}
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
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }}
              className={`${inputBase} font-mono ${errors.phone ? errorBorder : normalBorder}`}
            />
            {errors.phone && <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">อีเมลติดต่อ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
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
              placeholder="เช่น 14 มี.ค. 1984"
              className={`${inputBase} ${normalBorder}`}
            />
          </div>
        </div>

        <ModalCustomFieldsSection
          contactLabel={contactLabel}
          definitions={cf.definitions}
          values={customDraft}
          redactedFlags={cf.redactedFlags}
          canEditField={cf.canEditField}
          onChange={(k, v) => setCustomDraft((prev) => ({ ...prev, [k]: v }))}
        />
      </form>
    </Modal>
  );
};
