import { z } from 'zod';
import type { Customer } from '../../types';
import type { KeyValueStorage } from '../../services/industryProfileRepository';

export const CUSTOMERS_STORAGE_KEY = 'cb360_customers_data';

const contactPersonSchema = z.object({
  id: z.string(),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string(),
  roleOrTitle: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  lineId: z.string().optional(),
  isPrimary: z.boolean(),
  notes: z.string().optional(),
});

const customerAddressSchema = z.object({
  id: z.string(),
  type: z.enum(['BILLING', 'SHIPPING', 'OFFICE', 'WAREHOUSE', 'BRANCH', 'OTHER']),
  title: z.string(),
  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  addressLine1: z.string(),
  subdistrict: z.string(),
  district: z.string(),
  province: z.string(),
  postalCode: z.string(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googlePlaceId: z.string().optional(),
  formattedAddress: z.string().optional(),
  mapUrl: z.string().optional(),
  isDefaultBilling: z.boolean().optional(),
  isDefaultShipping: z.boolean().optional(),
  deliveryNotes: z.string().optional(),
});

export const customerRecordSchema: z.ZodType<Customer> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  contacts: z.array(contactPersonSchema).optional(),
  addresses: z.array(customerAddressSchema).optional(),
  avatar: z.string().optional(),
  initials: z.string(),
  tier: z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM']),
  creditGrade: z.enum(['A', 'B', 'C', 'D']),
  segments: z.array(z.string()),
  lifetimeValue: z.number(),
  spend12Months: z.number(),
  orders12Months: z.number(),
  lastOrderDaysAgo: z.number(),
  lastOrderCode: z.string(),
  lastOrderAmount: z.number(),
  tierValidUntil: z.string(),
  tierProgressPercent: z.number(),
  tierTargetSpend: z.number(),
  phone: z.string(),
  fullPhone: z.string(),
  email: z.string(),
  channels: z.object({
    line: z.boolean(),
    facebook: z.boolean(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  }),
  birthday: z.string(),
  customerSince: z.string(),
  consent: z.object({
    marketingLine: z.boolean(),
    marketingEmail: z.boolean(),
    marketingSms: z.boolean(),
    marketingPhone: z.boolean().optional(),
    profilingAnalytics: z.boolean().optional(),
    sensitiveMedical: z.boolean().optional(),
    policyVersion: z.string().optional(),
    consentSource: z
      .enum(['LINE LIFF', 'Web Form', '3CX Call', 'Walk-in', 'Email', 'Admin'])
      .optional(),
    updatedAt: z.string().optional(),
  }),
  creditLimit: z.number(),
  creditUsed: z.number(),
  creditOverdue: z.number(),
  churnRisk: z.enum(['ต่ำ', 'ปานกลาง', 'สูง']),
  nextBestAction: z.object({
    description: z.string(),
    actionLabel: z.string(),
  }),
});

export const loadStoredCustomers = (
  storage: KeyValueStorage | null,
  seedCustomers: readonly Customer[],
  storageKey: string = CUSTOMERS_STORAGE_KEY
): Customer[] => {
  if (!storage) return [...seedCustomers];
  const raw = storage.getItem(storageKey);
  if (!raw) return [...seedCustomers];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...seedCustomers];
    }
    const valid: Customer[] = [];
    for (const item of parsed) {
      const checked = customerRecordSchema.safeParse(item);
      if (checked.success) valid.push(checked.data);
    }
    if (valid.length === 0) return [...seedCustomers];

    const storedIds = new Set(valid.map((c) => c.id.toUpperCase()));
    const missingSeeds = seedCustomers.filter((s) => !storedIds.has(s.id.toUpperCase()));
    return missingSeeds.length > 0 ? [...valid, ...missingSeeds] : valid;
  } catch {
    return [...seedCustomers];
  }
};

export const saveStoredCustomers = (
  storage: KeyValueStorage | null,
  customers: readonly Customer[],
  storageKey: string = CUSTOMERS_STORAGE_KEY
): void => {
  if (!storage) return;
  try {
    storage.setItem(storageKey, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to persist customers to storage', err);
  }
};

export const mergeRemoteCustomers = (
  localCustomers: readonly Customer[],
  remoteCustomers: readonly Customer[],
  seedCustomers: readonly Customer[]
): Customer[] => {
  if (remoteCustomers.length === 0) return [...localCustomers];

  const remoteById = new Map(remoteCustomers.map((c) => [c.id.toUpperCase(), c]));
  const seen = new Set<string>();
  const result: Customer[] = [];

  // Prepend remote records that don't exist in local yet (created on another client/session)
  const localIds = new Set(localCustomers.map((c) => c.id.toUpperCase()));
  for (const remote of remoteCustomers) {
    const key = remote.id.toUpperCase();
    if (!localIds.has(key) && !seen.has(key)) {
      result.push(remote);
      seen.add(key);
    }
  }

  // Merge local order, letting remote win on matching IDs
  for (const local of localCustomers) {
    const key = local.id.toUpperCase();
    if (seen.has(key)) continue;
    result.push(remoteById.get(key) ?? local);
    seen.add(key);
  }

  for (const seed of seedCustomers) {
    const key = seed.id.toUpperCase();
    if (!seen.has(key)) {
      result.push(seed);
      seen.add(key);
    }
  }

  return result;
};
