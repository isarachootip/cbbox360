import { z } from 'zod';
import type { ConsentPolicyTemplate, DsrRequest } from '../../types';
import type { KeyValueStorage } from '../../services/industryProfileRepository';

export const DSR_STORAGE_KEY = 'cb360_consent_dsr';
export const POLICY_STORAGE_KEY = 'cb360_consent_policies';

export const consentSourceSchema = z.enum([
  'LINE LIFF',
  'Web Form',
  '3CX Call',
  'Walk-in',
  'Email',
  'Admin',
]);

export const dsrRequestSchema: z.ZodType<DsrRequest> = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  requestType: z.enum([
    'ACCESS_EXPORT',
    'WITHDRAW_CONSENT',
    'RECTIFICATION',
    'ERASURE_ANONYMIZE',
  ]),
  channel: consentSourceSchema,
  reason: z.string(),
  status: z.enum(['Open', 'In Review', 'Completed', 'Overdue']),
  slaDaysLeft: z.number(),
  assignee: z.string(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  resolutionNote: z.string().optional(),
});

export const consentPolicySchema: z.ZodType<ConsentPolicyTemplate> = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  effectiveDate: z.string().min(1),
  summary: z.string(),
  lineConsentMessage: z.string(),
  isActive: z.boolean(),
});

const loadList = <T>(
  storage: KeyValueStorage | null,
  key: string,
  schema: z.ZodType<T>,
  fallback: readonly T[]
): T[] => {
  if (!storage) return [...fallback];
  const raw = storage.getItem(key);
  if (!raw) return [...fallback];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...fallback];
    const valid: T[] = [];
    for (const item of parsed) {
      const checked = schema.safeParse(item);
      if (checked.success) valid.push(checked.data);
    }
    return valid.length > 0 ? valid : [...fallback];
  } catch {
    return [...fallback];
  }
};

export const loadStoredDsrRequests = (
  storage: KeyValueStorage | null,
  seed: readonly DsrRequest[]
): DsrRequest[] => loadList(storage, DSR_STORAGE_KEY, dsrRequestSchema, seed);

export const saveStoredDsrRequests = (
  storage: KeyValueStorage | null,
  requests: readonly DsrRequest[]
): void => {
  if (!storage) return;
  try {
    storage.setItem(DSR_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to persist DSR requests', err);
  }
};

export const loadStoredConsentPolicies = (
  storage: KeyValueStorage | null,
  seed: readonly ConsentPolicyTemplate[]
): ConsentPolicyTemplate[] =>
  loadList(storage, POLICY_STORAGE_KEY, consentPolicySchema, seed);

export const saveStoredConsentPolicies = (
  storage: KeyValueStorage | null,
  policies: readonly ConsentPolicyTemplate[]
): void => {
  if (!storage) return;
  try {
    storage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policies));
  } catch (err) {
    console.error('Failed to persist consent policies', err);
  }
};
