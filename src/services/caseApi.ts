import { z } from 'zod';
import type { Ticket, TicketPriority, TicketStatus } from '../types';

const activityLogSchema = z.object({
  time: z.string(),
  author: z.string(),
  text: z.string(),
  type: z.enum(['system', 'workflow', 'agent']).optional(),
});

const ticketRecordSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerTier: z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM']).catch('MEMBER'),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  systemName: z.string().optional(),
  priority: z.enum(['Critical', 'High', 'Normal', 'Low']).optional(),
  channel: z.enum(['LINE', 'Facebook', '3CX', 'Email', 'Web form']).catch('LINE'),
  status: z.enum(['Open', 'In Progress', 'Pending', 'Waiting', 'Resolved', 'Closed']).catch('Open'),
  slaHoursLeft: z.number().catch(4),
  slaFormatted: z.string().catch('4 ชม.'),
  slaStatus: z.enum(['normal', 'warning', 'danger']).catch('normal'),
  assignee: z.string().catch('Unassigned'),
  createdAt: z.string().catch('วันนี้'),
  conversationId: z.string().optional(),
  externalTicketId: z.string().optional(),
  externalSystem: z.string().optional(),
  externalUrl: z.string().optional(),
  orderRef: z.string().optional(),
  orderAmount: z.number().optional(),
  slaTargetNote: z.string().optional(),
  activityLogs: z.array(activityLogSchema).catch([]),
});

export interface CasePatchInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  systemName?: string;
  description?: string;
  category?: string;
  externalTicketId?: string | null;
  externalSystem?: string | null;
  externalUrl?: string | null;
}

export type CaseListResult = { ok: true; cases: Ticket[] } | { ok: false; error: string };
export type SingleCaseResult = { ok: true; record: Ticket } | { ok: false; error: string };

const request = async (
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown } | null> => {
  try {
    const res = await fetch(`/api/cases${path}`, {
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

const parseSingle = (body: unknown): SingleCaseResult => {
  const parsed = z.object({ case: ticketRecordSchema }).safeParse(body);
  return parsed.success
    ? { ok: true, record: parsed.data.case }
    : { ok: false, error: 'BAD_RESPONSE' };
};

export const caseApi = {
  async list(customerId?: string): Promise<CaseListResult> {
    const qs = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    const res = await request(qs);
    if (!res) return { ok: false, error: 'NETWORK_ERROR' };
    if (res.status !== 200) return { ok: false, error: 'HTTP_ERROR' };
    const parsed = z.object({ cases: z.array(ticketRecordSchema) }).safeParse(res.body);
    return parsed.success
      ? { ok: true, cases: parsed.data.cases }
      : { ok: false, error: 'BAD_RESPONSE' };
  },

  async create(payload: Omit<Ticket, 'id' | 'createdAt' | 'activityLogs'>): Promise<SingleCaseResult> {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) return { ok: false, error: 'NETWORK_ERROR' };
    return res.status === 201 || res.status === 200 ? parseSingle(res.body) : { ok: false, error: 'HTTP_ERROR' };
  },

  async update(caseId: string, patch: CasePatchInput): Promise<SingleCaseResult> {
    const res = await request(`/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!res) return { ok: false, error: 'NETWORK_ERROR' };
    return res.status === 200 ? parseSingle(res.body) : { ok: false, error: 'HTTP_ERROR' };
  },

  async addLog(caseId: string, text: string, author?: string): Promise<SingleCaseResult> {
    const res = await request(`/${encodeURIComponent(caseId)}/logs`, {
      method: 'POST',
      body: JSON.stringify({ text, author }),
    });
    if (!res) return { ok: false, error: 'NETWORK_ERROR' };
    return res.status === 200 ? parseSingle(res.body) : { ok: false, error: 'HTTP_ERROR' };
  },
};
