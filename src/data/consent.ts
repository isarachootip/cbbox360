import type { ConsentPolicyTemplate, DsrRequest, DsrRequestType } from '../types';

export const DSR_REQUEST_TYPE_META: Record<
  DsrRequestType,
  { label: string; shortLabel: string; description: string }
> = {
  ACCESS_EXPORT: {
    label: 'ขอสำเนา / โอนย้ายข้อมูล (Access & Portability)',
    shortLabel: 'ขอสำเนาข้อมูล',
    description: 'ส่งออกสำเนาข้อมูลส่วนบุคคลของลูกค้าในรูปแบบ JSON / CSV ตามมาตรา 30–31',
  },
  WITHDRAW_CONSENT: {
    label: 'ขอถอนความยินยอมการตลาด (Withdraw Consent)',
    shortLabel: 'ถอนความยินยอม',
    description: 'ระงับการส่งข่าวสารโปรโมชั่นทุกช่องทาง (LINE, Email, SMS, 3CX) ทันทีตามมาตรา 19',
  },
  RECTIFICATION: {
    label: 'ขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)',
    shortLabel: 'ขอแก้ไขข้อมูล',
    description: 'ตรวจสอบและปรับปรุงข้อมูลส่วนบุคคลของลูกค้าให้ถูกต้องเป็นปัจจุบันตามมาตรา 35',
  },
  ERASURE_ANONYMIZE: {
    label: 'ขอลบ / ระงับการใช้ข้อมูล (Erasure & Anonymize)',
    shortLabel: 'ขอลบ/ระงับข้อมูล',
    description: 'เพิกถอนความยินยอมทั้งหมดรวมถึง Profiling/ม.26 และล้างข้อมูลติดต่อที่ไม่จำเป็นตามกฎหมาย',
  },
};

export const mockDsrRequests: DsrRequest[] = [
  {
    id: 'DSR-2601',
    customerId: 'C00123',
    customerName: 'สมชาย ใจดี',
    requestType: 'ACCESS_EXPORT',
    channel: 'LINE LIFF',
    reason: 'ขอรับรายงานข้อมูลส่วนบุคคลและประวัติความยินยอมเพื่อใช้ตรวจสอบภายใน',
    status: 'Open',
    slaDaysLeft: 24,
    assignee: 'สมศักดิ์ บ. (DPO)',
    createdAt: '2026-11-11',
  },
  {
    id: 'DSR-2602',
    customerId: 'C00125',
    customerName: 'Pim Chanida',
    requestType: 'WITHDRAW_CONSENT',
    channel: 'Web Form',
    reason: 'ขอยกเลิกการรับข้อความโปรโมชั่นผ่าน LINE และ SMS ชั่วคราว',
    status: 'In Review',
    slaDaysLeft: 4,
    assignee: 'อนุชา จ.',
    createdAt: '2026-10-22',
  },
  {
    id: 'DSR-2603',
    customerId: 'C00128',
    customerName: 'Tanawat K.',
    requestType: 'ERASURE_ANONYMIZE',
    channel: 'Email',
    reason: 'ไม่ได้ใช้บริการต่อ จึงขอให้ระงับการประมวลผลข้อมูลการตลาดและลบอีเมลติดต่อ',
    status: 'Overdue',
    slaDaysLeft: -2,
    assignee: 'สมศักดิ์ บ. (DPO)',
    createdAt: '2026-10-15',
  },
  {
    id: 'DSR-2604',
    customerId: 'C00134',
    customerName: 'รพ.สัตว์ใจดี',
    requestType: 'RECTIFICATION',
    channel: '3CX Call',
    reason: 'แจ้งอัปเดตเบอร์ติดต่อผู้ประสานงานฝ่ายจัดซื้อและอีเมลรับใบแจ้งหนี้',
    status: 'Completed',
    slaDaysLeft: 19,
    assignee: 'วิภา ส.',
    createdAt: '2026-11-02',
    resolvedAt: '2026-11-04',
    resolutionNote: 'ตรวจสอบและปรับปรุงข้อมูลผู้ติดต่อหลักใน Customer 360 เรียบร้อยแล้ว',
  },
];

export const mockConsentPolicies: ConsentPolicyTemplate[] = [
  {
    id: 'pol-v2.1',
    version: 'v2.1',
    title: 'ประกาศความเป็นส่วนตัวและความยินยอมลูกค้า CusBox360 (ฉบับปัจจุบัน)',
    effectiveDate: '2026-10-01',
    summary:
      'ครอบคลุมการแจ้งวัตถุประสงค์จัดเก็บข้อมูลติดต่อ การสื่อสารการตลาดผ่าน LINE OA / Email / SMS / 3CX การวิเคราะห์กลุ่มลูกค้า CDP และความยินยอมข้อมูลอ่อนไหวด้านสุขภาพ (มาตรา 26)',
    lineConsentMessage:
      'เรียนคุณลูกค้า บริษัทขอความร่วมมือยืนยันหรือปรับตั้งค่าความยินยอมข้อมูลส่วนบุคคล (PDPA Policy v2.1) ได้ตลอดเวลาที่ลิงก์ทางการ: https://liff.line.me/cb360-pdpa-consent',
    isActive: true,
  },
  {
    id: 'pol-v2.0',
    version: 'v2.0',
    title: 'ประกาศความเป็นส่วนตัวมาตรฐานสำหรับลูกค้าองค์กรและรายย่อย',
    effectiveDate: '2026-01-15',
    summary:
      'นโยบายฉบับก่อนปรับปรุง รองรับความยินยอมรับข่าวสารผ่าน LINE, Email และ SMS พื้นฐาน',
    lineConsentMessage:
      'ตรวจสอบนโยบายคุ้มครองข้อมูลส่วนบุคคล (v2.0) ได้ที่: https://liff.line.me/cb360-pdpa-v2',
    isActive: false,
  },
];
