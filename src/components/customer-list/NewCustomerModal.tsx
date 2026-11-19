import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { TierType, CreditGrade, Customer, CustomerType, CreateCustomerInput } from '../../types';
import { EMPTY_PERSON_NAME_DRAFT, PersonNameDraft, PersonNameFields } from '../customer-360/PersonNameFields';
import { CorporateDraft, CorporateIdentityFields, CustomerTypeToggle } from '../customer-360/CorporateIdentityFields';
import { CorporatePrimaryContactSection, CustomerTierCreditFields } from './CustomerTierCreditFields';
import { CustomerContactChannelsFields } from './CustomerContactChannelsFields';
import { ModalCustomFieldsSection } from './ModalCustomFieldsSection';
import { CustomerFormErrors, validateAndBuildCreateCustomer } from '../../domain/customer/customerValidation';
import { useLabel } from '../../../core/client/hooks/useLabel';
import { useEntitlement } from '../../../core/client/hooks/useEntitlement';
import { useTenantRuntime } from '../../../core/client/providers/TenantRuntimeContext';

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
  const { t, contactLabel } = useLabel();
  const { isEntitled, hasPermission } = useEntitlement();
  const { contactFieldDefs } = useTenantRuntime();
  const isCommercialB2B = isEntitled('module:credit-sales');

  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [personDraft, setPersonDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [corpDraft, setCorpDraft] = useState<CorporateDraft>(INITIAL_CORP_DRAFT);
  const [contactDraft, setContactDraft] = useState<PersonNameDraft>(EMPTY_PERSON_NAME_DRAFT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<TierType>('MEMBER');
  const [creditGrade, setCreditGrade] = useState<CreditGrade>('B');
  const [creditLimit, setCreditLimit] = useState('0');
  const [contactRole, setContactRole] = useState('ผู้จัดการฝ่ายจัดซื้อ');
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const [cfError, setCfError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setCfError(null);
    setCustomerType('INDIVIDUAL');
    setCreditLimit(isCommercialB2B ? '50000' : '0');
    if (initialPhone) setPhone(initialPhone);
  }, [isOpen, initialPhone, isCommercialB2B]);

  const resetForm = () => {
    setPersonDraft(EMPTY_PERSON_NAME_DRAFT); setCorpDraft(INITIAL_CORP_DRAFT); setContactDraft(EMPTY_PERSON_NAME_DRAFT);
    setPhone(''); setEmail(''); setTier('MEMBER'); setCreditGrade('B');
    setCustomValues({}); setCfError(null); setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfError(null);
    const effectiveType: CustomerType = isCommercialB2B ? customerType : 'INDIVIDUAL';
    const validation = validateAndBuildCreateCustomer({
      customerType: effectiveType, personDraft, corpDraft, contactDraft, contactRole,
      phone, email, tier, creditGrade, creditLimit: isCommercialB2B ? creditLimit : '0',
    });
    if (!validation.ok) return setErrors(validation.errors);

    const missingReq = contactFieldDefs.find(
      (def) => def.validation?.required && String(customValues[def.key] ?? '').trim() === ''
    );
    if (missingReq) return setCfError(`กรุณากรอกข้อมูลช่อง "${missingReq.label}"`);

    setSaving(true);
    const created = onSubmit(validation.payload);
    if (contactFieldDefs.length > 0 && Object.keys(customValues).length > 0) {
      try {
        const res = await fetch(`/api/contacts/${encodeURIComponent(created.id)}/custom-fields`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: customValues }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSaving(false);
          setCfError(data?.errors?.[0]?.message || data?.error || 'บันทึกฟิลด์เพิ่มเติมไม่สำเร็จ');
          return;
        }
        window.dispatchEvent(new CustomEvent('cb360:contact-cf-updated', { detail: { contactId: created.id } }));
      } catch {
        // Offline mode continues cleanly
      }
    }
    setSaving(false);
    resetForm();
    onClose();
  };

  const alertText = cfError || (Object.keys(errors).length > 0 ? 'กรุณาตรวจสอบข้อมูลที่มีเครื่องหมายดอกจัน (*) ให้ครบถ้วน' : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('contact.create_button', `เพิ่มข้อมูล${contactLabel}ใหม่`)}
      subtitle={`กรอกข้อมูลพื้นฐานและรายละเอียดเฉพาะของ${contactLabel}เพื่อบันทึกเข้าสู่ระบบ`}
      maxWidth="3xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" form={formId} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold shadow-card disabled:opacity-60 cursor-pointer">
            <Check className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        {isCommercialB2B && (
          <CustomerTypeToggle value={customerType} onChange={(next) => { setCustomerType(next); setErrors({}); }} />
        )}

        {alertText && (
          <div role="alert" className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-rose-200 bg-danger-bg text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{alertText}</span>
          </div>
        )}

        {!isCommercialB2B || customerType === 'INDIVIDUAL' ? (
          <PersonNameFields
            value={personDraft}
            onChange={(next) => {
              setPersonDraft(next);
              if (errors.firstName && next.firstName.trim()) setErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            firstNameRequired
            firstNameError={errors.firstName}
            autoFocusFirstName={isOpen}
          />
        ) : (
          <CorporateIdentityFields
            value={corpDraft}
            onChange={(next) => { setCorpDraft(next); setErrors((prev) => ({ ...prev, companyName: undefined, taxId: undefined })); }}
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
          onPhoneChange={(val) => { setPhone(val); if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined })); }}
          onEmailChange={(val) => { setEmail(val); if (errors.email) setErrors((prev) => ({ ...prev, email: undefined })); }}
        />

        {isCommercialB2B && customerType === 'CORPORATE' && (
          <CorporatePrimaryContactSection contactRole={contactRole} onRoleChange={setContactRole} personDraft={contactDraft} onPersonChange={setContactDraft} />
        )}

        {isCommercialB2B ? (
          <CustomerTierCreditFields
            tier={tier}
            creditGrade={creditGrade}
            creditLimit={creditLimit}
            creditLimitError={errors.creditLimit}
            onTierChange={setTier}
            onGradeChange={setCreditGrade}
            onLimitChange={(val) => { setCreditLimit(val); if (errors.creditLimit) setErrors((prev) => ({ ...prev, creditLimit: undefined })); }}
          />
        ) : (
          <ModalCustomFieldsSection
            contactLabel={contactLabel}
            definitions={contactFieldDefs}
            values={customValues}
            canEditField={(def) => {
              const perm = def.acl?.editPerm || (def.sensitivity === 'pdpa_s26' ? 'contact.pdpa_s26:write' : 'contact:write');
              return hasPermission(perm) || (def.sensitivity === 'pdpa_s26' && hasPermission('contact.pdpa_s26:write'));
            }}
            onChange={(k, v) => setCustomValues((prev) => ({ ...prev, [k]: v }))}
          />
        )}
      </form>
    </Modal>
  );
};
