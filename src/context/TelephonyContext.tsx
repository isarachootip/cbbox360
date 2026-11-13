import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CallLogRecord, CtiScreenPopQuery, CustomerPhoneMatch } from '../types';
import {
  buildCallTimelineEvent,
  formatNowCallTimestamp,
  loadStoredCallLogs,
  saveStoredCallLogs,
} from '../domain/telephony/callLogHelpers';
import { useCustomer } from './CustomerContext';
import { useAuth } from './AuthContext';

interface TelephonyContextType {
  callLogs: CallLogRecord[];
  activeCall: CallLogRecord | null;
  registerScreenPopCall: (
    query: CtiScreenPopQuery,
    match?: CustomerPhoneMatch
  ) => CallLogRecord;
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

  useEffect(() => {
    saveStoredCallLogs(callLogs);
  }, [callLogs]);

  const agentName = currentUser?.name || 'วิภา ส.';

  const registerScreenPopCall = useCallback(
    (query: CtiScreenPopQuery, match?: CustomerPhoneMatch): CallLogRecord => {
      const newRecord: CallLogRecord = {
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
      };

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
      const cleanSummary = summary.trim() || 'รับสายผ่าน 3CX Screen-Pop เรียบร้อย';

      setCallLogs((prev) =>
        prev.map((log) =>
          log.id === activeCall.id
            ? {
                ...log,
                status: 'Completed',
                summary: cleanSummary,
                durationFormatted:
                  log.durationFormatted === 'กำลังสนทนา' ? '02:15' : log.durationFormatted,
              }
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
    setCallLogs((prev) =>
      prev.map((log) =>
        log.id === activeCall.id && log.status === 'Active'
          ? { ...log, status: 'Completed', durationFormatted: '01:05' }
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
  if (!ctx) {
    throw new Error('useTelephony must be used within a TelephonyProvider');
  }
  return ctx;
};
