import { describe, it, expect } from 'vitest';
import type { Ticket } from '../../types';
import { computeCaseKpis, getPriorityIndicator, matchesCaseSearch } from './caseMetrics';

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'CS-4001',
    customerId: 'SF001',
    customerName: 'บจก. สยามเทค',
    customerTier: 'PLATINUM',
    title: 'ERP ขึ้น Error 500',
    category: 'ระบบล่ม / ใช้งานไม่ได้',
    systemName: 'ERP Billing',
    priority: 'Critical',
    channel: 'LINE',
    status: 'In Progress',
    slaHoursLeft: -1,
    slaFormatted: 'เกิน 20 นาที',
    slaStatus: 'danger',
    assignee: 'กฤษณะ',
    createdAt: 'วันนี้ 10:16',
    externalTicketId: 'HD-90412',
    activityLogs: [],
  },
  {
    id: 'CS-4002',
    customerId: 'SF002',
    customerName: 'หจก. เจริญรุ่งเรือง',
    customerTier: 'GOLD',
    title: 'Handheld สแกนไม่ได้',
    category: 'แจ้งซ่อม / ตรวจเช็คอุปกรณ์',
    systemName: 'WMS Handheld',
    priority: 'High',
    channel: 'LINE',
    status: 'Open',
    slaHoursLeft: 4,
    slaFormatted: '4 ชม.',
    slaStatus: 'normal',
    assignee: 'สุชาติ',
    createdAt: 'วันนี้ 09:45',
    activityLogs: [],
  },
  {
    id: 'CS-4003',
    customerId: 'SF003',
    customerName: 'คลินิกสไมล์พลัส',
    customerTier: 'SILVER',
    title: 'Export รายงาน Excel',
    category: 'สอบถามการใช้งานระบบ',
    priority: 'Normal',
    channel: 'Facebook',
    status: 'Resolved',
    slaHoursLeft: 0,
    slaFormatted: 'ปิดแล้ว',
    slaStatus: 'normal',
    assignee: 'นพดล',
    createdAt: 'วันนี้ 09:10',
    activityLogs: [],
  },
];

describe('caseMetrics domain helpers', () => {
  it('computes live KPI counts accurately from tenant tickets', () => {
    expect(computeCaseKpis(SAMPLE_TICKETS)).toEqual({
      openCount: 2,
      inProgressCount: 1,
      overSlaCount: 1,
      closedOrResolvedCount: 1,
    });
  });

  it('matches search query by id, title, systemName, and externalTicketId', () => {
    expect(matchesCaseSearch(SAMPLE_TICKETS[0], 'HD-90412')).toBe(true);
    expect(matchesCaseSearch(SAMPLE_TICKETS[0], 'erp billing')).toBe(true);
    expect(matchesCaseSearch(SAMPLE_TICKETS[1], 'HD-90412')).toBe(false);
    expect(matchesCaseSearch(SAMPLE_TICKETS[2], '')).toBe(true);
  });

  it('returns Clean UI dot + text color tokens for priorities', () => {
    expect(getPriorityIndicator('Critical').text).toBe('text-rose-600');
    expect(getPriorityIndicator('High').dot).toBe('bg-amber-500');
    expect(getPriorityIndicator('Normal').dot).toBe('bg-blue-500');
  });
});
