import { z } from 'zod';
import type { ConsentPolicyTemplate, DsrRequest } from '../types';
import { consentPolicySchema, dsrRequestSchema } from '../domain/consent/consentStorage';

export type ConsentApiErrorCode =
  | 'INVALID_DSR_PAYLOAD'
  | 'INVALID_POLICY_PAYLOAD'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'CONSENT_SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'BAD_RESPONSE';

export type ConsentApiError = { status: 'error'; code: ConsentApiErrorCode };
export type ConsentOverviewResult =
  | { status: 'ok'; dsrRequests: DsrRequest[]; policies: ConsentPolicyTemplate[] }
  | ConsentApiError;
export type SaveDsrResult = { status: 'ok'; dsrRequest: DsrRequest } | ConsentApiError;
export type SavePolicyResult = { status: 'ok'; policy: ConsentPolicyTemplate } | ConsentApiError;

const KNOWN_CODES: ConsentApiErrorCode[] = [
  'INVALID_DSR_PAYLOAD',
  'INVALID_POLICY_PAYLOAD',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CONSENT_SERVICE_UNAVAILABLE',
];

const errorSchema = z.object({ error: z.string().optional() });

const request = async (
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown } | null> => {
  try {
    const res = await fetch(`/api/consent${path}`, {
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

const toError = (body: unknown): ConsentApiError => {
  const parsed = errorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error : undefined;
  const known = KNOWN_CODES.find((c) => c === code);
  return { status: 'error', code: known ?? 'BAD_RESPONSE' };
};

export const consentApi = {
  async getOverview(): Promise<ConsentOverviewResult> {
    const res = await request('');
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z
      .object({
        dsrRequests: z.array(dsrRequestSchema),
        policies: z.array(consentPolicySchema),
      })
      .safeParse(res.body);
    return parsed.success
      ? { status: 'ok', dsrRequests: parsed.data.dsrRequests, policies: parsed.data.policies }
      : { status: 'error', code: 'BAD_RESPONSE' };
  },

  async saveDsr(dsrRequest: DsrRequest): Promise<SaveDsrResult> {
    const res = await request('/dsr', {
      method: 'POST',
      body: JSON.stringify({ dsrRequest }),
    });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z.object({ dsrRequest: dsrRequestSchema }).safeParse(res.body);
    return parsed.success
      ? { status: 'ok', dsrRequest: parsed.data.dsrRequest }
      : { status: 'error', code: 'BAD_RESPONSE' };
  },

  async savePolicy(policy: ConsentPolicyTemplate): Promise<SavePolicyResult> {
    const res = await request('/policies', {
      method: 'POST',
      body: JSON.stringify({ policy }),
    });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z.object({ policy: consentPolicySchema }).safeParse(res.body);
    return parsed.success
      ? { status: 'ok', policy: parsed.data.policy }
      : { status: 'error', code: 'BAD_RESPONSE' };
  },
};
