import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { TierType, CreditGrade, Customer, CustomerType, CreateCustomerInput } from '../../types';
import { EMPTY_PERSON_NAME_DRAFT, PersonNameDraft, PersonNameFields } from '../customer-360/PersonNameFields';
import { CorporateDraft, CorporateIdentityFields, CustomerTypeToggle } from '../customer-360/CorporateIdentityFields';
import { CorporatePrimaryContactSection, CustomerTierCreditFields } from './CustomerTierCreditFields';
import { CustomerContactChannelsFields } from './CustomerContactChannelsFields';
import { CustomerFormErrors, validateAndBuildCreateCustomer } from '../../domain/customer/customerValidation';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onSubmit: (customerData: CreateCustomerInput) => Customer;
}

const INITIAL_CORP_DRAFT: CorporateDraft = { companyName: '', taxId: '', branchCode: '00000' };

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  initialPhone,
  onSubmit,
}) => {
  const formId = useId();
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [corpDraft, setCorpDraft] = useState<CorporateDraft>(INITIAL_CORP_DRAFT);
  const [contactDraft, setContactDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<TierType>('MEMBER');
  const [creditGrade, setCreditGrade] = useState<CreditGrade>('B');
  const [creditLimit, setCreditLimit] = useState('50000');
  const [contactRole, setContactRole] = useState('ผู้จัดการฝ่ายจัดซื้อ');
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (initialPhone) setPhone(initialPhone);
  }, [isOpen, initialPhone]);

  const resetForm = () => {
    setPersonDraft(EMPTY_PERSON_NAME_DRAFT);
    setCorpDraft(INITIAL_CORP_DRAFT);
    setContactDraft(EMPTY_PERSON_NAME_DRAFT);
    setPhone('');
    setEmail('');
    setTier('MEMBER');
    setCreditGrade('B');
    setCreditLimit('50000');
    setContactRole('ผู้จัดการฝ่ายจัดซื้อ');
    setCustomerType('INDIVIDUAL');
    setErrors({});
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAndBuildCreateCustomer({
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
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(validation.payload);
    resetForm();
    onClose();
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="เพิ่มข้อมูลลูกค้าใหม่ใน CDP"
      subtitle="กรอกข้อมูลลูกค้า B2C หรือองค์กร B2B เพื่อสร้างโปรไฟล์ Customer 360° และบันทึกเข้าสู่ระบบ"
      maxWidth="3xl"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
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
            <span>บันทึกข้อมูล</span>
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

        {hasErrors && (
          <div
            role="alert"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-rose-200 bg-danger-bg text-xs font-medium text-rose-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>กรุณาตรวจสอบข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) หรือแก้ไขรูปแบบข้อมูลให้ถูกต้องก่อนบันทึก</span>
          </div>
        )}

        {customerType === 'INDIVIDUAL' ? (
          <PersonNameFields
            value={personDraft}
            onChange={(next) => {
              setPersonDraft(next);
              if (errors.firstName && next.firstName.trim()) {
                setErrors((prev) => ({ ...prev, firstName: undefined }));
              }
            }}
            firstNameRequired
            firstNameError={errors.firstName}
            autoFocusFirstName={isOpen}
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
            autoFocusCompanyName={isOpen}
          />
        )}

        <CustomerContactChannelsFields
          phone={phone}
          email={email}
          phoneError={errors.phone}
          emailError={errors.email}
          onPhoneChange={(val) => {
            setPhone(val);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          onEmailChange={(val) => {
            setEmail(val);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
        />

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
          creditLimitError={errors.creditLimit}
          onTierChange={setTier}
          onGradeChange={setCreditGrade}
          onLimitChange={(val) => {
            setCreditLimit(val);
            if (errors.creditLimit) setErrors((prev) => ({ ...prev, creditLimit: undefined }));
          }}
        />
      </form>
    </Modal>
  );
};
