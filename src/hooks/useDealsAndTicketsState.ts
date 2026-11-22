import { useEffect, useState } from 'react';
import type { Deal, Ticket, TimelineEvent } from '../types';
import { mockDeals } from '../data/deals';
import { mockTickets } from '../data/tickets';
import { mockTimelineEvents } from '../data/timeline';
import { useAuth } from '../context/AuthContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';
import { caseApi, CasePatchInput } from '../services/caseApi';

const STAGE_PROBABILITIES: Record<Deal['stage'], number> = {
  Lead: 10,
  Qualified: 25,
  Proposal: 50,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
};

export const useDealsAndTicketsState = () => {
  const { currentUser } = useAuth();
  const { tenantId, isLoaded } = useTenantRuntime();
  const isDefaultTenant = tenantId === 'default';

  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);

  useEffect(() => {
    if (isDefaultTenant) {
      setDeals(mockDeals);
      setTimelineEvents(mockTimelineEvents);
    } else {
      setDeals([]);
      setTickets([]);
      setTimelineEvents([]);
    }

    if (!currentUser) {
      if (isDefaultTenant) setTickets(mockTickets);
      return;
    }

    let cancelled = false;
    const loadWorkspace = async () => {
      const [caseRes, seedRes] = await Promise.all([
        caseApi.list(),
        isDefaultTenant
          ? Promise.resolve(null)
          : fetch('/api/tenant/seed-workspace', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
      ]);
      if (cancelled) return;

      if (seedRes) {
        if (Array.isArray(seedRes.deals)) setDeals(seedRes.deals);
        if (Array.isArray(seedRes.timelineEvents)) setTimelineEvents(seedRes.timelineEvents);
      }

      if (caseRes.ok && caseRes.cases.length > 0) {
        setTickets(caseRes.cases);
      } else if (!isDefaultTenant && Array.isArray(seedRes?.tickets)) {
        setTickets(seedRes.tickets);
      } else if (isDefaultTenant) {
        setTickets(mockTickets);
      }
    };

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [tenantId, isLoaded, isDefaultTenant, currentUser?.id]);

  const addTimelineEvent = (event: TimelineEvent) => {
    setTimelineEvents((prev) => [event, ...prev]);
  };

  const updateDealStage = (dealId: string, newStage: Deal['stage'], lostReason?: string) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: newStage,
              probability: STAGE_PROBABILITIES[newStage] ?? 10,
              lostReason:
                lostReason || (newStage === 'Closed Lost' ? d.lostReason || 'ราคา' : undefined),
              daysInStage: 0,
            }
          : d
      )
    );
  };

  const addDeal = (dealData: Omit<Deal, 'id' | 'createdDate'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: `D-${Math.floor(100 + Math.random() * 900)}`,
      createdDate: 'วันนี้',
    };
    setDeals((prev) => [newDeal, ...prev]);
  };

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'activityLogs'>) => {
    const tempId = `CS-${Math.floor(4100 + Math.random() * 899)}`;
    const optimistic: Ticket = {
      ...ticketData,
      id: tempId,
      createdAt: 'วันนี้',
      activityLogs: [
        { time: 'เพิ่งสร้าง', author: currentUser?.name || 'ระบบ', text: `สร้างเคสใหม่: ${ticketData.title}`, type: 'system' },
      ],
    };
    setTickets((prev) => [optimistic, ...prev]);
    void caseApi.create(ticketData).then((res) => {
      if (res.ok) setTickets((prev) => prev.map((t) => (t.id === tempId ? res.record : t)));
    });
    addTimelineEvent({
      id: `tl-case-${Date.now()}`,
      customerId: ticketData.customerId,
      type: 'Ticket',
      iconCode: 'TK',
      title: `เปิดเคสใหม่: ${ticketData.title}`,
      time: 'เมื่อสักครู่',
      detail: `${ticketData.category}${ticketData.systemName ? ` · ระบบ ${ticketData.systemName}` : ''}`,
      meta: [ticketData.channel, ticketData.priority || 'Normal'],
      linkText: 'เปิดดูเคส',
      linkRoute: `/cases?caseId=${tempId}`,
      colorScheme: 'blue',
    });
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    void caseApi.update(ticketId, { status }).then((res) => {
      if (res.ok) setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.record : t)));
    });
  };

  const updateTicketDetails = (ticketId: string, patch: CasePatchInput) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              ...patch,
              externalTicketId: patch.externalTicketId === null ? undefined : (patch.externalTicketId ?? t.externalTicketId),
              externalSystem: patch.externalSystem === null ? undefined : (patch.externalSystem ?? t.externalSystem),
              externalUrl: patch.externalUrl === null ? undefined : (patch.externalUrl ?? t.externalUrl),
            }
          : t
      )
    );
    void caseApi.update(ticketId, patch).then((res) => {
      if (res.ok) setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.record : t)));
    });
  };

  const addTicketLog = (ticketId: string, text: string, author: string = currentUser?.name || 'วิภา ส.') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, activityLogs: [...t.activityLogs, { time: timeStr, author, text, type: 'agent' }] } : t
      )
    );
    void caseApi.addLog(ticketId, text, author).then((res) => {
      if (res.ok) setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.record : t)));
    });
  };

  const cascadeCustomerNameToDealsAndTickets = (customerId: string, newName: string) => {
    setDeals((prev) => prev.map((d) => (d.customerId === customerId ? { ...d, customerName: newName } : d)));
    setTickets((prev) => prev.map((t) => (t.customerId === customerId ? { ...t, customerName: newName } : t)));
  };

  return {
    deals,
    tickets,
    timelineEvents,
    addTimelineEvent,
    updateDealStage,
    addDeal,
    addTicket,
    updateTicketStatus,
    updateTicketDetails,
    addTicketLog,
    cascadeCustomerNameToDealsAndTickets,
  };
};
