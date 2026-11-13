import { z } from 'zod';
import type { CallLogRecord, TimelineEvent } from '../../types';
import { initialCallLogs } from '../../data/callLogs';

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
});

const callLogArraySchema = z.array(callLogRecordSchema);

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
