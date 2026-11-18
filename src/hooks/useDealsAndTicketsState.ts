import { useEffect, useState } from 'react';
import type { Deal, Ticket, TimelineEvent } from '../types';
import { mockDeals } from '../data/deals';
import { mockTickets } from '../data/tickets';
import { mockTimelineEvents } from '../data/timeline';
import { useAuth } from '../context/AuthContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

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
      setTickets(mockTickets);
      setTimelineEvents(mockTimelineEvents);
      return;
    }

    setDeals([]);
    setTickets([]);
    setTimelineEvents([]);

    if (!currentUser) return;
    let cancelled = false;
    fetch('/api/tenant/seed-workspace', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.deals)) setDeals(data.deals);
        if (Array.isArray(data.tickets)) setTickets(data.tickets);
        if (Array.isArray(data.timelineEvents)) setTimelineEvents(data.timelineEvents);
      })
      .catch(() => {
        // Keep clean empty arrays for non-default tenants when offline
      });
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
    const newTicket: Ticket = {
      ...ticketData,
      id: `TK-${Math.floor(2320 + Math.random() * 100)}`,
      createdAt: 'วันนี้',
      activityLogs: [{ time: 'เพิ่งสร้าง', author: 'ระบบ', text: `สร้างเคสใหม่: ${ticketData.title}`, type: 'system' }],
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
  };

  const addTicketLog = (ticketId: string, text: string, author: string = 'วิภา ส.') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, activityLogs: [...t.activityLogs, { time: timeStr, author, text, type: 'agent' }] }
          : t
      )
    );
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
    addTicketLog,
    cascadeCustomerNameToDealsAndTickets,
  };
};
