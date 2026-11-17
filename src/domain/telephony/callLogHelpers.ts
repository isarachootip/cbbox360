import { z } from 'zod';
import type { CallLogRecord, CtiScreenPopQuery, CustomerPhoneMatch, TimelineEvent } from '../../types';
import { initialCallLogs } from '../../data/callLogs';

export interface CreateOutboundCallInput {
  displayPhone: string;
  normalizedPhone: string;
  dialUrl: string;
  ext?: string;
  customerId?: string;
  customerName?: string;
  matchedContactName?: string;
}

const CALL_LOGS_STORAGE_KEY = 'cb360_call_logs_v1';

const callLogRecordSchema = z.object({
  id: z.string(),
  callId: z.string().optional(),
  phone: z.string(),
  normalizedPhone: z.string(),
  ext: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['Active', 'Completed', 'Missed']),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  matchedContactName: z.string().optional(),
  summary: z.string().optional(),
  durationFormatted: z.string(),
  timestamp: z.string(),
  agentName: z.string(),
  dialUrl: z.string().optional(),
  startedAtMs: z.number().optional(),
});

const callLogArraySchema = z.array(callLogRecordSchema);

export const formatElapsedDuration = (startedAtMs?: number, nowMs = Date.now()): string => {
  if (!startedAtMs || nowMs <= startedAtMs) {
    return '00:00';
  }
  const totalSeconds = Math.max(1, Math.floor((nowMs - startedAtMs) / 1000));
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const formatNowCallTimestamp = (): string => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return `วันนี้ ${hh}:${mm}`;
};

export const loadStoredCallLogs = (): CallLogRecord[] => {
  try {
    const raw = sessionStorage.getItem(CALL_LOGS_STORAGE_KEY);
    if (!raw) return initialCallLogs;
    const parsed = callLogArraySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : initialCallLogs;
  } catch {
    return initialCallLogs;
  }
};

export const saveStoredCallLogs = (logs: CallLogRecord[]): void => {
  try {
    sessionStorage.setItem(CALL_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota errors
  }
};

export const createScreenPopCallRecord = (
  query: CtiScreenPopQuery,
  agentName: string,
  match?: CustomerPhoneMatch
): CallLogRecord => ({
  id: `call-${Date.now()}`,
  callId: query.callId,
  phone: query.displayNumber || query.rawNumber,
  normalizedPhone: query.normalizedNumber,
  ext: query.ext,
  direction: query.direction,
  status: 'Active',
  customerId: match?.customer.id,
  customerName: match?.customer.name,
  matchedContactName: match?.matchedLabel,
  durationFormatted: 'กำลังสนทนา',
  timestamp: formatNowCallTimestamp(),
  agentName,
  startedAtMs: Date.now(),
});

export const createOutboundCallRecord = (
  input: CreateOutboundCallInput,
  agentName: string
): CallLogRecord => {
  const nowMs = Date.now();
  return {
    id: `call-${nowMs}`,
    callId: `out-${Math.floor(10000 + Math.random() * 90000)}`,
    phone: input.displayPhone,
    normalizedPhone: input.normalizedPhone,
    ext: input.ext || undefined,
    direction: 'outbound',
    status: 'Active',
    customerId: input.customerId,
    customerName: input.customerName,
    matchedContactName: input.matchedContactName,
    durationFormatted: 'กำลังโทรออก',
    timestamp: formatNowCallTimestamp(),
    agentName,
    dialUrl: input.dialUrl,
    startedAtMs: nowMs,
  };
};

export const buildCallTimelineEvent = (
  call: CallLogRecord,
  customerId: string,
  summary: string,
  agentName: string
): TimelineEvent => {
  const metaItems = [`เบอร์: ${call.phone}`, `Agent: ${agentName}`];
  if (call.ext) metaItems.push(`Ext: ${call.ext}`);
  if (call.callId) metaItems.push(`Call ID: ${call.callId}`);

  return {
    id: `tl-call-${Date.now()}`,
    customerId,
    type: 'โทร',
    iconCode: 'TL',
    title: `${call.direction === 'outbound' ? 'สายออก' : 'สายเข้า'} 3CX · ${call.phone}`,
    time: formatNowCallTimestamp(),
    detail: summary,
    meta: metaItems,
    linkText: 'เปิดใน Voice (3CX)',
    linkRoute: '/voice',
    colorScheme: 'teal',
  };
};
