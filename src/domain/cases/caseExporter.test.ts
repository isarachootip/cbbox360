import { describe, it, expect } from 'vitest';
import type { Ticket } from '../../types';
import { buildCasesCsv } from './caseExporter';

const SAMPLE: Ticket[] = [
  {
    id: 'CS-4001',
    customerId: 'SF001',
    customerName: 'บจก. สยามเทค, เอ็นเตอร์ไพรส์',
    customerTier: 'PLATINUM',
    title: 'ERP ขึ้น "Error 500"',
    category: 'ระบบล่ม / ใช้งานไม่ได้',
    systemName: 'ERP Billing',
    serviceMode: 'On-site',
    assetSerial: 'SN-9901',
    siteLocation: 'สาขาสาทร',
    reporterName: 'คุณธนกฤต',
    reporterPhone: '081-901-2244',
    rootCause: '=CMD() injection attempt',
    resolutionSummary: 'เพิ่ม connection pool และรีสตาร์ทบริการ',
    priority: 'Critical',
    channel: 'LINE',
    status: 'Resolved',
    slaHoursLeft: 1,
    slaFormatted: '1 ชม.',
    slaStatus: 'normal',
    assignee: 'วิศวกร L2',
    createdAt: 'วันนี้ 10:16',
    externalTicketId: 'HD-90412',
    activityLogs: [],
  },
];

describe('caseExporter CSV builder', () => {
  it('prepends UTF-8 BOM for Thai Excel compatibility and escapes commas/quotes', () => {
    const csv = buildCasesCsv(SAMPLE);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"บจก. สยามเทค, เอ็นเตอร์ไพรส์"');
    expect(csv).toContain('"ERP ขึ้น ""Error 500"""');
    expect(csv).toContain('SN-9901');
    expect(csv).toContain('On-site');
  });

  it('neutralizes spreadsheet formula injection characters', () => {
    const csv = buildCasesCsv(SAMPLE);
    expect(csv).toContain("'=CMD() injection attempt");
  });
});
