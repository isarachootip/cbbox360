import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CallLogRecord, CtiScreenPopQuery, CustomerPhoneMatch } from '../types';
import {
  buildCallTimelineEvent,
  createOutboundCallRecord,
  createScreenPopCallRecord,
  formatElapsedDuration,
  loadStoredCallLogs,
  saveStoredCallLogs,
  type CreateOutboundCallInput,
} from '../domain/telephony/callLogHelpers';
import { useCustomer } from './CustomerContext';
import { useAuth } from './AuthContext';

export type RegisterOutboundCallInput = CreateOutboundCallInput;

interface TelephonyContextType {
  callLogs: CallLogRecord[];
  activeCall: CallLogRecord | null;
  registerScreenPopCall: (
    query: CtiScreenPopQuery,
    match?: CustomerPhoneMatch
  ) => CallLogRecord;
  registerOutboundCall: (input: RegisterOutboundCallInput) => CallLogRecord;
  attachCustomerToActiveCall: (
    customerId: string,
    customerName: string,
    matchedContactName?: string
  ) => void;
  completeActiveCall: (summary: string) => void;
  dismissActiveCall: () => void;
}

const TelephonyContext = createContext<TelephonyContextType | undefined>(undefined);

export const TelephonyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTimelineEvent } = useCustomer();
  const { currentUser } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>(loadStoredCallLogs);
  const [activeCall, setActiveCall] = useState<CallLogRecord | null>(null);

  useEffect(() => saveStoredCallLogs(callLogs), [callLogs]);

  const agentName = currentUser?.name || 'วิภา ส.';

  const registerScreenPopCall = useCallback(
    (query: CtiScreenPopQuery, match?: CustomerPhoneMatch): CallLogRecord => {
      const newRecord = createScreenPopCallRecord(query, agentName, match);
      setActiveCall((prev) =>
        prev &&
        prev.status === 'Active' &&
        prev.normalizedPhone === query.normalizedNumber &&
        prev.callId === query.callId
          ? prev
          : newRecord
      );
      setCallLogs((prev) => {
        const duplicate = prev.some(
          (item) =>
            item.status === 'Active' &&
            item.normalizedPhone === query.normalizedNumber &&
            item.callId === query.callId
        );
        return duplicate ? prev : [newRecord, ...prev];
      });
      return newRecord;
    },
    [agentName]
  );

  const registerOutboundCall = useCallback(
    (input: RegisterOutboundCallInput): CallLogRecord => {
      const newRecord = createOutboundCallRecord(input, agentName);
      setActiveCall(newRecord);
      setCallLogs((prev) => [newRecord, ...prev]);
      return newRecord;
    },
    [agentName]
  );

  const attachCustomerToActiveCall = useCallback(
    (customerId: string, customerName: string, matchedContactName?: string) => {
      setActiveCall((prev) =>
        prev ? { ...prev, customerId, customerName, matchedContactName } : null
      );
      setCallLogs((prev) =>
        prev.map((log, idx) =>
          idx === 0 && log.status === 'Active'
            ? { ...log, customerId, customerName, matchedContactName }
            : log
        )
      );
    },
    []
  );

  const completeActiveCall = useCallback(
    (summary: string) => {
      if (!activeCall) return;
      const defaultSummary =
        activeCall.direction === 'outbound'
          ? 'โทรออกผ่าน PABX WebPhone (Click-to-Call) เรียบร้อย'
          : 'รับสายผ่าน 3CX Screen-Pop เรียบร้อย';
      const cleanSummary = summary.trim() || defaultSummary;
      const elapsed = activeCall.startedAtMs
        ? formatElapsedDuration(activeCall.startedAtMs)
        : '02:15';

      setCallLogs((prev) =>
        prev.map((log) =>
          log.id === activeCall.id
            ? { ...log, status: 'Completed', summary: cleanSummary, durationFormatted: elapsed }
            : log
        )
      );
      if (activeCall.customerId) {
        addTimelineEvent(
          buildCallTimelineEvent(activeCall, activeCall.customerId, cleanSummary, agentName)
        );
      }
      setActiveCall(null);
    },
    [activeCall, addTimelineEvent, agentName]
  );

  const dismissActiveCall = useCallback(() => {
    if (!activeCall) return;
    const elapsed = activeCall.startedAtMs
      ? formatElapsedDuration(activeCall.startedAtMs)
      : '01:05';
    setCallLogs((prev) =>
      prev.map((log) =>
        log.id === activeCall.id && log.status === 'Active'
          ? { ...log, status: 'Completed', durationFormatted: elapsed }
          : log
      )
    );
    setActiveCall(null);
  }, [activeCall]);

  return (
    <TelephonyContext.Provider
      value={{
        callLogs,
        activeCall,
        registerScreenPopCall,
        registerOutboundCall,
        attachCustomerToActiveCall,
        completeActiveCall,
        dismissActiveCall,
      }}
    >
      {children}
    </TelephonyContext.Provider>
  );
};

export const useTelephony = (): TelephonyContextType => {
  const ctx = useContext(TelephonyContext);
  if (!ctx) throw new Error('useTelephony must be used within a TelephonyProvider');
  return ctx;
};
