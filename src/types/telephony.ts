import type { Customer } from './index';

export type CallDirection = 'inbound' | 'outbound';
export type CallLogStatus = 'Active' | 'Completed' | 'Missed';
export type PhoneMatchField = 'primary' | 'contact' | 'address';

export interface CtiScreenPopQuery {
  rawNumber: string;
  normalizedNumber: string;
  displayNumber: string;
  ext?: string;
  callId?: string;
  direction: CallDirection;
}

export interface CustomerPhoneMatch {
  customer: Customer;
  matchedField: PhoneMatchField;
  matchedLabel: string;
  matchedRawPhone: string;
  normalizedPhone: string;
}

export interface CallLogRecord {
  id: string;
  callId?: string;
  phone: string;
  normalizedPhone: string;
  ext?: string;
  direction: CallDirection;
  status: CallLogStatus;
  customerId?: string;
  customerName?: string;
  matchedContactName?: string;
  summary?: string;
  durationFormatted: string;
  timestamp: string;
  agentName: string;
}
