import type { Ticket, TicketPriority, TicketStatus } from '../../types';

export interface CaseKpis {
  openCount: number;
  inProgressCount: number;
  overSlaCount: number;
  closedOrResolvedCount: number;
}

export const CASE_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'Open', label: 'Open (รับเรื่อง)' },
  { value: 'In Progress', label: 'In Progress (กำลังแก้ไข)' },
  { value: 'Waiting', label: 'Waiting (รอลูกค้า)' },
  { value: 'Resolved', label: 'Resolved (แก้ไขแล้ว)' },
  { value: 'Closed', label: 'Closed (ปิดงาน)' },
];

export const CASE_PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'Critical', label: 'Critical (ฉุกเฉิน / ระบบล่ม)' },
  { value: 'High', label: 'High (ด่วน)' },
  { value: 'Normal', label: 'Normal (ปกติ)' },
  { value: 'Low', label: 'Low (ไม่ด่วน)' },
];

export const getPriorityIndicator = (priority: TicketPriority = 'Normal') => {
  switch (priority) {
    case 'Critical':
      return { dot: 'bg-rose-500', text: 'text-rose-600', label: 'Critical' };
    case 'High':
      return { dot: 'bg-amber-500', text: 'text-amber-600', label: 'High' };
    case 'Low':
      return { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Low' };
    default:
      return { dot: 'bg-blue-500', text: 'text-blue-600', label: 'Normal' };
  }
};

export const computeCaseKpis = (tickets: Ticket[]): CaseKpis => {
  let openCount = 0;
  let inProgressCount = 0;
  let overSlaCount = 0;
  let closedOrResolvedCount = 0;

  for (const t of tickets) {
    if (t.status === 'Closed' || t.status === 'Resolved') {
      closedOrResolvedCount += 1;
    } else {
      openCount += 1;
      if (t.status === 'In Progress') inProgressCount += 1;
      if (t.slaStatus === 'danger') overSlaCount += 1;
    }
  }

  return { openCount, inProgressCount, overSlaCount, closedOrResolvedCount };
};

export const matchesCaseSearch = (ticket: Ticket, rawQuery: string): boolean => {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    ticket.id,
    ticket.title,
    ticket.customerName,
    ticket.category,
    ticket.systemName || '',
    ticket.externalTicketId || '',
    ticket.assignee,
  ];
  return haystacks.some((val) => val.toLowerCase().includes(q));
};
