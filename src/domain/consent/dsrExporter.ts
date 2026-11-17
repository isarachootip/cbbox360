import type { Customer, CustomerConsentFlags, DsrRequestType } from '../../types';
import { resolveCustomerConsent } from './consentMetrics';

export interface CustomerPortabilityPayload {
  standard: string;
  exportedAt: string;
  customerId: string;
  personalData: {
    fullName: string;
    customerType: string;
    phone: string;
    email: string;
    birthday: string;
    tier: string;
    segments: string[];
    addressesCount: number;
    contactsCount: number;
  };
  consentStatus: ReturnType<typeof resolveCustomerConsent>;
}

export interface DsrCustomerMutationPatch {
  consent?: Partial<CustomerConsentFlags>;
  email?: string;
  nickname?: string;
}

export const buildCustomerPortabilityPayload = (
  customer: Customer,
  nowIso: string = new Date().toISOString()
): CustomerPortabilityPayload => ({
  standard: 'PDPA Thailand B.E. 2562 — Data Portability Report (Section 31)',
  exportedAt: nowIso,
  customerId: customer.id,
  personalData: {
    fullName: customer.name,
    customerType: customer.customerType || 'INDIVIDUAL',
    phone: customer.fullPhone || customer.phone,
    email: customer.email,
    birthday: customer.birthday,
    tier: customer.tier,
    segments: customer.segments,
    addressesCount: customer.addresses?.length ?? 0,
    contactsCount: customer.contacts?.length ?? 0,
  },
  consentStatus: resolveCustomerConsent(customer),
});

const escapeCsvCell = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCustomerPortabilityCsv = (customers: readonly Customer[]): string => {
  const headers = [
    'Customer ID',
    'ชื่อลูกค้า / องค์กร',
    'ประเภท',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'Tier',
    'Consent LINE',
    'Consent Email',
    'Consent SMS',
    'Consent 3CX Phone',
    'Consent CDP Profiling',
    'Consent ม.26 สุขภาพ',
    'Policy Version',
    'ช่องทางที่ได้มา',
  ];

  const rows = customers.map((c) => {
    const cs = resolveCustomerConsent(c);
    return [
      c.id,
      c.name,
      c.customerType || 'INDIVIDUAL',
      c.fullPhone || c.phone,
      c.email || '-',
      c.tier,
      cs.marketingLine ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.marketingEmail ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.marketingSms ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.marketingPhone ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.profilingAnalytics ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.sensitiveMedical ? 'ยินยอม' : 'ไม่ยินยอม',
      cs.policyVersion,
      cs.consentSource,
    ]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(',');
  });

  return `\uFEFF${[headers.join(','), ...rows].join('\n')}`;
};

export const applyDsrAutomationToCustomer = (
  customer: Customer,
  requestType: DsrRequestType,
  updatedDate: string = new Date().toISOString().split('T')[0]
): DsrCustomerMutationPatch => {
  const current = resolveCustomerConsent(customer);

  if (requestType === 'WITHDRAW_CONSENT') {
    return {
      consent: {
        ...current,
        marketingLine: false,
        marketingEmail: false,
        marketingSms: false,
        marketingPhone: false,
        consentSource: 'Admin',
        updatedAt: updatedDate,
      },
    };
  }

  if (requestType === 'ERASURE_ANONYMIZE') {
    return {
      email: '',
      nickname: undefined,
      consent: {
        ...current,
        marketingLine: false,
        marketingEmail: false,
        marketingSms: false,
        marketingPhone: false,
        profilingAnalytics: false,
        sensitiveMedical: false,
        consentSource: 'Admin',
        updatedAt: updatedDate,
      },
    };
  }

  return {
    consent: {
      ...current,
      updatedAt: updatedDate,
    },
  };
};

export const triggerBrowserDownload = (
  filename: string,
  content: string,
  mimeType: string
): void => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
