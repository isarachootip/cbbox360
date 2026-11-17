import type {
  ConsentFilterPreset,
  Customer,
  DsrRequest,
  ResolvedCustomerConsent,
} from '../../types';
import { matchesCustomerSearch } from '../customer/customerSearch';

export interface ConsentKpiSummary {
  totalCustomers: number;
  optInCount: number;
  optInRatePercent: number;
  lineOptInCount: number;
  lineOptInPercent: number;
  pendingDsrCount: number;
  urgentSlaCount: number;
}

export const resolveCustomerConsent = (
  customer: Pick<Customer, 'consent' | 'customerSince'>
): ResolvedCustomerConsent => ({
  marketingLine: Boolean(customer.consent?.marketingLine),
  marketingEmail: Boolean(customer.consent?.marketingEmail),
  marketingSms: Boolean(customer.consent?.marketingSms),
  marketingPhone: customer.consent?.marketingPhone ?? true,
  profilingAnalytics: customer.consent?.profilingAnalytics ?? true,
  sensitiveMedical: customer.consent?.sensitiveMedical ?? false,
  policyVersion: customer.consent?.policyVersion || 'v2.1',
  consentSource: customer.consent?.consentSource || 'LINE LIFF',
  updatedAt: customer.consent?.updatedAt || customer.customerSince || '2026-09-01',
});

export const hasAnyMarketingConsent = (customer: Pick<Customer, 'consent' | 'customerSince'>): boolean => {
  const c = resolveCustomerConsent(customer);
  return c.marketingLine || c.marketingEmail || c.marketingSms || c.marketingPhone;
};

export const computeConsentKpis = (
  customers: readonly Customer[],
  dsrRequests: readonly DsrRequest[]
): ConsentKpiSummary => {
  const totalCustomers = customers.length;
  const optInCount = customers.filter((c) => hasAnyMarketingConsent(c)).length;
  const lineOptInCount = customers.filter((c) => Boolean(c.consent?.marketingLine)).length;
  const optInRatePercent =
    totalCustomers > 0 ? Math.round((optInCount / totalCustomers) * 100) : 0;
  const lineOptInPercent =
    totalCustomers > 0 ? Math.round((lineOptInCount / totalCustomers) * 100) : 0;

  const activeDsr = dsrRequests.filter((r) => r.status !== 'Completed');
  const pendingDsrCount = activeDsr.length;
  const urgentSlaCount = activeDsr.filter(
    (r) => r.status === 'Overdue' || r.slaDaysLeft <= 5
  ).length;

  return {
    totalCustomers,
    optInCount,
    optInRatePercent,
    lineOptInCount,
    lineOptInPercent,
    pendingDsrCount,
    urgentSlaCount,
  };
};

export const filterConsentCustomers = (
  customers: readonly Customer[],
  searchQuery: string,
  preset: ConsentFilterPreset
): Customer[] => {
  return customers.filter((customer) => {
    if (!matchesCustomerSearch(customer, searchQuery)) return false;
    const resolved = resolveCustomerConsent(customer);
    switch (preset) {
      case 'line_opt_in':
        return resolved.marketingLine;
      case 'all_opted_out':
        return !resolved.marketingLine && !resolved.marketingEmail && !resolved.marketingSms;
      case 'sensitive_granted':
        return resolved.sensitiveMedical;
      case 'all':
      default:
        return true;
    }
  });
};
