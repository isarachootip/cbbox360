export type ConsentSource =
  | 'LINE LIFF'
  | 'Web Form'
  | '3CX Call'
  | 'Walk-in'
  | 'Email'
  | 'Admin';

export interface CustomerConsentFlags {
  marketingLine: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
  marketingPhone?: boolean;
  profilingAnalytics?: boolean;
  sensitiveMedical?: boolean;
  policyVersion?: string;
  consentSource?: ConsentSource;
  updatedAt?: string;
}

export interface ResolvedCustomerConsent {
  marketingLine: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
  marketingPhone: boolean;
  profilingAnalytics: boolean;
  sensitiveMedical: boolean;
  policyVersion: string;
  consentSource: ConsentSource;
  updatedAt: string;
}

export type ConsentFilterPreset =
  | 'all'
  | 'line_opt_in'
  | 'all_opted_out'
  | 'sensitive_granted';

export type DsrRequestType =
  | 'ACCESS_EXPORT'
  | 'WITHDRAW_CONSENT'
  | 'RECTIFICATION'
  | 'ERASURE_ANONYMIZE';

export type DsrStatus = 'Open' | 'In Review' | 'Completed' | 'Overdue';

export interface DsrRequest {
  id: string;
  customerId: string;
  customerName: string;
  requestType: DsrRequestType;
  channel: ConsentSource;
  reason: string;
  status: DsrStatus;
  slaDaysLeft: number;
  assignee: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ConsentPolicyTemplate {
  id: string;
  version: string;
  title: string;
  effectiveDate: string;
  summary: string;
  lineConsentMessage: string;
  isActive: boolean;
}
