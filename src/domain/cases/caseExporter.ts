import type { Ticket } from '../../types';

const CSV_HEADERS = [
  'Case ID',
  'External Ref',
  'หัวข้อปัญหา',
  'ลูกค้า',
  'หมวดเคส',
  'ระบบงาน/อุปกรณ์',
  'ประเภทบริการ',
  'Serial No.',
  'สาขา/สถานที่หน้างาน',
  'ผู้แจ้งหน้างาน',
  'เบอร์ติดต่อกลับ',
  'ความเร่งด่วน',
  'สถานะ',
  'ผู้รับผิดชอบ',
  'ช่องทาง',
  'SLA',
  'สาเหตุ (Root Cause)',
  'สรุปวิธีแก้ไข (Resolution)',
  'วันที่สร้าง',
];

const escapeCsvCell = (raw: string | number | undefined | null): string => {
  const str = String(raw ?? '').replace(/\r?\n/g, ' ');
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
};

export const buildCasesCsv = (tickets: Ticket[]): string => {
  const rows = tickets.map((t) =>
    [
      t.id,
      t.externalTicketId || '',
      t.title,
      t.customerName,
      t.category,
      t.systemName || '',
      t.serviceMode || 'Remote',
      t.assetSerial || '',
      t.siteLocation || '',
      t.reporterName || '',
      t.reporterPhone || '',
      t.priority || 'Normal',
      t.status,
      t.assignee,
      t.channel,
      t.slaFormatted,
      t.rootCause || '',
      t.resolutionSummary || '',
      t.createdAt,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return `\uFEFF${[CSV_HEADERS.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`;
};

export const downloadCasesCsv = (tickets: Ticket[], prefix = 'cb360-cases'): void => {
  const csv = buildCasesCsv(tickets);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
