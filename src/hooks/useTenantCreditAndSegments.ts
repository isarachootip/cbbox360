import { useEffect, useState } from 'react';
import type { CreditAccount, CreditLimitRequest, Segment } from '../types';
import { mockCreditAccounts, mockCreditLimitRequests } from '../data/credit';
import { mockSegments } from '../data/segments';
import { useAuth } from '../context/AuthContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

interface SeedWorkspaceCreditPayload {
  creditAccounts?: CreditAccount[];
  creditRequests?: CreditLimitRequest[];
}

export const useTenantCreditAndSegments = (
  onApproveCustomerCreditLimit: (customerId: string, nextLimit: number) => void
) => {
  const { currentUser } = useAuth();
  const { tenantId, isLoaded } = useTenantRuntime();
  const isDefaultTenant = tenantId === 'default';

  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>(mockCreditAccounts);
  const [creditRequests, setCreditRequests] =
    useState<CreditLimitRequest[]>(mockCreditLimitRequests);
  const [segments, setSegments] = useState<Segment[]>(mockSegments);

  useEffect(() => {
    if (isDefaultTenant) {
      setCreditAccounts(mockCreditAccounts);
      setCreditRequests(mockCreditLimitRequests);
      return;
    }

    setCreditAccounts([]);
    setCreditRequests([]);
    if (!currentUser) return;

    let cancelled = false;
    fetch('/api/tenant/seed-workspace', { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<SeedWorkspaceCreditPayload>) : null))
      .then((payload) => {
        if (cancelled || !payload) return;
        if (Array.isArray(payload.creditAccounts)) setCreditAccounts(payload.creditAccounts);
        if (Array.isArray(payload.creditRequests)) setCreditRequests(payload.creditRequests);
      })
      .catch(() => {
        // Offline graceful fallback
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId, isLoaded, isDefaultTenant, currentUser?.id]);

  const approveCreditLimit = (requestId: string) => {
    const req = creditRequests.find((r) => r.id === requestId);
    if (!req) return;
    setCreditRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );
    onApproveCustomerCreditLimit(req.customerId, req.requestedLimit);
  };

  const rejectCreditLimit = (requestId: string) => {
    setCreditRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  const toggleSegmentWebhook = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, webhookEnabled: !s.webhookEnabled } : s))
    );
  };

  const updateSegmentRules = (segmentId: string, rules: Segment['rules']) => {
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, rules } : s)));
  };

  const cascadeCustomerNameToCredit = (customerId: string, newName: string) => {
    setCreditAccounts((prev) =>
      prev.map((acc) => (acc.customerId === customerId ? { ...acc, customerName: newName } : acc))
    );
    setCreditRequests((prev) =>
      prev.map((req) => (req.customerId === customerId ? { ...req, customerName: newName } : req))
    );
  };

  return {
    creditAccounts,
    creditRequests,
    segments,
    approveCreditLimit,
    rejectCreditLimit,
    toggleSegmentWebhook,
    updateSegmentRules,
    cascadeCustomerNameToCredit,
  };
};
