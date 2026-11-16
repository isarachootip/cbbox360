import { z } from 'zod';
import type { Customer } from '../types';
import { customerRecordSchema } from '../domain/customer/customerStorage';

export type CustomerApiErrorCode =
  | 'INVALID_CUSTOMER_PAYLOAD'
  | 'ID_MISMATCH'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'CUSTOMER_SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'BAD_RESPONSE';

export type CustomerApiError = { status: 'error'; code: CustomerApiErrorCode };
export type CustomerListResult = { status: 'ok'; customers: Customer[] } | CustomerApiError;
export type SingleCustomerResult = { status: 'ok'; customer: Customer } | CustomerApiError;

const KNOWN_CODES: CustomerApiErrorCode[] = [
  'INVALID_CUSTOMER_PAYLOAD',
  'ID_MISMATCH',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CUSTOMER_SERVICE_UNAVAILABLE',
];

const errorSchema = z.object({ error: z.string().optional() });

const request = async (
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown } | null> => {
  try {
    const res = await fetch(`/api/customers${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const body: unknown = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } catch {
    return null;
  }
};

const toError = (body: unknown): CustomerApiError => {
  const parsed = errorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error : undefined;
  const known = KNOWN_CODES.find((c) => c === code);
  return { status: 'error', code: known ?? 'BAD_RESPONSE' };
};

const parseOne = (body: unknown): SingleCustomerResult => {
  const parsed = z.object({ customer: customerRecordSchema }).safeParse(body);
  return parsed.success
    ? { status: 'ok', customer: parsed.data.customer }
    : { status: 'error', code: 'BAD_RESPONSE' };
};

export const customerApi = {
  async list(): Promise<CustomerListResult> {
    const res = await request('');
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z.object({ customers: z.array(customerRecordSchema) }).safeParse(res.body);
    return parsed.success
      ? { status: 'ok', customers: parsed.data.customers }
      : { status: 'error', code: 'BAD_RESPONSE' };
  },

  async create(customer: Customer): Promise<SingleCustomerResult> {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify({ customer }),
    });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 201 || res.status === 200 ? parseOne(res.body) : toError(res.body);
  },

  async update(customer: Customer): Promise<SingleCustomerResult> {
    const res = await request(`/${encodeURIComponent(customer.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ customer }),
    });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? parseOne(res.body) : toError(res.body);
  },
};
