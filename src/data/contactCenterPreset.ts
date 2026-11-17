import {
  BusinessTemplatePreset,
  CompanyProfile,
  KnowledgeItem,
} from '../types';
import { contactCenterConnectors } from './industryConnectors';

export const contactCenterCompanyProfile: CompanyProfile = {
  companyName: 'ศูนย์บริการลูกค้าสัมพันธ์ คอนแทคโปร 360 (ContactPro Helpdesk Center)',
  businessType: 'ศูนย์บริการลูกค้าสัมพันธ์ รับแจ้งปัญหา และบริหารจัดการเคสครบวงจร (Omnichannel Contact Center)',
  description:
    'ศูนย์กลางรับเรื่องสอบถาม แจ้งเหตุขัดข้อง ร้องเรียน และประสานงานส่งต่อทีมผู้เชี่ยวชาญผ่านโทรศัพท์ 3CX, LINE OA, Facebook และอีเมล พร้อมระบบควบคุมมาตรฐานเวลาให้บริการ (SLA) และวัดผลความพึงพอใจ (CSAT)',
  phone: '02-026-3600 (Call Center 24 ชม.)',
  email: 'support@contactpro360.co.th',
  lineId: '@contactpro360',
  website: 'https://www.contactpro360.co.th',
  address: '99 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ ชั้น 22 ถ.รัชดาภิเษก เขตดินแดง กรุงเทพฯ 10400',
  businessHoursText: 'เปิดให้บริการรับสายและแชททุกวัน ตลอด 24 ชั่วโมง (ทีมเทคนิคเฉพาะทาง จ.-ส. 08:30 - 20:00 น.)',
};

export const contactCenterKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'km-cc-sla',
    title: 'มาตรฐานระดับการให้บริการ (SLA Policy & Escalation)',
    category: 'policies_sla',
    content:
      'แบ่งระดับการดูแลเป็น 3 ระดับ: 1) VIP แก้ไขหรือแจ้งความคืบหน้าภายใน 1 ชั่วโมง, 2) Priority ภายใน 4 ชั่วโมง, 3) Standard ภายใน 24 ชั่วโมง หากใกล้เกินกำหนด ระบบจะแจ้งเตือน Supervisor อัตโนมัติ',
    tags: ['SLA', 'ระยะเวลาแก้ไข', 'VIP', 'ร้องเรียน'],
    isActive: true,
    templateId: 'contact_center',
    businessScope: 'contact_center',
  },
  {
    id: 'km-cc-kyc',
    title: 'ขั้นตอนการยืนยันตัวตนผู้ติดต่อ (KYC & PDPA Verification)',
    category: 'policies_sla',
    content:
      'ก่อนเปิดเผยข้อมูลบัญชีหรือเปลี่ยนแปลงข้อมูลสัญญา เจ้าหน้าที่ต้องตรวจสอบชื่อ-นามสกุลคู่กับเบอร์โทรศัพท์ที่ลงทะเบียน หรือเลขอ้างอิงสัญญา (Contract Ref) ทุกครั้งตามมาตรฐาน PDPA',
    tags: ['ยืนยันตัวตน', 'KYC', 'PDPA', 'ความปลอดภัย'],
    isActive: true,
    templateId: 'contact_center',
    businessScope: 'contact_center',
  },
  {
    id: 'km-cc-channels',
    title: 'ช่องทางติดต่อฉุกเฉินและการประเมินความพึงพอใจ (CSAT)',
    category: 'company_info',
    content:
      'ลูกค้าสามารถติดต่อผ่านสายด่วน 02-026-3600 หรือ LINE @contactpro360 ได้ตลอด 24 ชม. หลังปิดเคสทุกครั้งจะมีข้อความขอคะแนนความพึงพอใจ (1-5 คะแนน) เพื่อประเมินคุณภาพการให้บริการ',
    tags: ['ช่องทางติดต่อ', 'สายด่วน', 'ประเมิน', 'CSAT'],
    isActive: true,
    templateId: 'contact_center',
    businessScope: 'contact_center',
  },
];

export const contactCenterPreset: BusinessTemplatePreset = {
  id: 'contact_center',
  name: 'Contact Center & Helpdesk',
  thaiTitle: 'ศูนย์บริการลูกค้าสัมพันธ์และรับแจ้งปัญหา (Helpdesk SLA)',
  tagline: 'รับเรื่องร้องเรียน เปิดเคสพร้อม SLA, เช็คสถานะ Ticket, โอนสาย/ส่งต่อทีม และวัดผล CSAT',
  description:
    'ชุดตั้งค่ามาตรฐานสำหรับศูนย์ Contact Center และ Helpdesk ผสานระบบโทรศัพท์ 3CX เข้ากับ Omnichannel Inbox, การยืนยันตัวตนผู้ติดต่อ (KYC), การส่งต่องานตาม Queue และการติดตาม SLA',
  iconName: 'headset',
  accentColor: 'cyan',
  recommendedMenus: [
    'menu-customer360',
    'menu-consent',
    'menu-inbox',
    'menu-canned-responses',
    'menu-cases',
    'menu-voice',
  ],
  customVariables: [
    { key: 'ticket_id', label: 'หมายเลขเคส (Ticket ID)', example: 'TK-2310' },
    { key: 'sla_time', label: 'กรอบเวลาดูแลตาม SLA', example: 'ภายใน 1 ชั่วโมง' },
    { key: 'sla_tier', label: 'ระดับสิทธิ์การดูแล (SLA Tier)', example: 'VIP (1 ชม.)' },
    { key: 'assigned_team', label: 'ทีมผู้รับผิดชอบ (Queue)', example: 'Tier 2 Escalation & VIP Desk' },
    { key: 'contract_ref', label: 'เลขอ้างอิงสัญญา/สมาชิก', example: 'SLA-2026-0891' },
  ],
  workflowHighlights: [
    'เปิดเคสรับแจ้งปัญหาพร้อมแจ้งเลข Ticket และกรอบเวลาแก้ไขตามระดับ SLA ของลูกค้าทันที',
    'สคริปต์ยืนยันตัวตนผู้ติดต่อ (KYC) และการโอนสาย/ส่งต่อเคสให้ทีมเฉพาะทางแบบไม่ต้องเล่าซ้ำ',
    'ส่งข้อความสำรวจความพึงพอใจ (CSAT 1–5) อัตโนมัติหลังปิดเคส พร้อมบันทึกในโปรไฟล์ผู้ติดต่อ',
  ],
  connectors: contactCenterConnectors,
  companyProfile: contactCenterCompanyProfile,
  knowledgeItems: contactCenterKnowledgeItems,
  cannedResponses: [
    {
      id: 'cr-cc-open-case',
      title: 'รับเรื่องแจ้งปัญหาและแจ้งหมายเลขเคสพร้อม SLA',
      shortcut: '/open-case',
      category: 'answer',
      content:
        'สวัสดีค่ะคุณ {customer_name} เจ้าหน้าที่ได้รับเรื่องและเปิดเคสหมายเลข {ticket_id} ให้เรียบร้อยแล้วค่ะ (ระดับสิทธิ์: {sla_tier}) ทีม {assigned_team} จะเร่งตรวจสอบและแจ้งผลกลับ{sla_time}นะคะ',
      tags: ['เปิดเคส', 'แจ้งปัญหา', 'SLA', 'Ticket'],
      isActive: true,
      businessScope: 'contact_center',
    },
    {
      id: 'cr-cc-case-status',
      title: 'แจ้งความคืบหน้าการติดตามสถานะเคส (Ticket Status)',
      shortcut: '/case-status',
      category: 'answer',
      content:
        'อัปเดตสถานะเคส {ticket_id} ของคุณ {customer_name}: ขณะนี้อยู่ระหว่างการดำเนินการโดยทีม {assigned_team} คาดว่าจะสามารถแจ้งผลการแก้ไขได้{sla_time}ค่ะ',
      tags: ['ตามเคส', 'สถานะเคส', 'ติดตามเรื่อง'],
      isActive: true,
      businessScope: 'contact_center',
    },
    {
      id: 'cr-cc-verify-kyc',
      title: 'ขอยืนยันตัวตนผู้ติดต่อก่อนตรวจสอบข้อมูล (KYC)',
      shortcut: '/verify-kyc',
      category: 'question',
      content:
        'เพื่อความปลอดภัยของข้อมูลส่วนบุคคล รบกวนคุณ {customer_name} ยืนยันตัวตนโดยแจ้ง 1) ชื่อ-นามสกุล 2) เบอร์โทรศัพท์ที่ลงทะเบียน หรือเลขอ้างอิงสัญญา ({contract_ref}) เพื่อให้เจ้าหน้าที่ตรวจสอบข้อมูลให้ค่ะ',
      tags: ['ยืนยันตัวตน', 'KYC', 'PDPA'],
      isActive: true,
      businessScope: 'contact_center',
    },
    {
      id: 'cr-cc-escalate',
      title: 'แจ้งโอนสาย / ส่งต่อเคสให้ทีมผู้เชี่ยวชาญเฉพาะทาง',
      shortcut: '/escalate',
      category: 'answer',
      content:
        'เจ้าหน้าที่ขออนุญาตส่งต่อเคส {ticket_id} ให้ทีมผู้เชี่ยวชาญ ({assigned_team}) ดูแลต่อโดยตรงนะคะ รายละเอียดทั้งหมดถูกบันทึกในระบบครบถ้วนแล้ว คุณลูกค้าไม่ต้องแจ้งข้อมูลซ้ำค่ะ',
      tags: ['โอนสาย', 'ส่งต่อทีม', 'Escalation'],
      isActive: true,
      businessScope: 'contact_center',
    },
    {
      id: 'cr-cc-csat',
      title: 'ปิดเคสและขอคะแนนประเมินความพึงพอใจ (CSAT Survey)',
      shortcut: '/csat',
      category: 'question',
      content:
        'เคสหมายเลข {ticket_id} ได้รับการแก้ไขเรียบร้อยแล้ว ขอบพระคุณคุณ {customer_name} ที่ติดต่อศูนย์บริการค่ะ รบกวนพิมพ์คะแนนความพึงพอใจ 1–5 (5 = พึงพอใจมากที่สุด) เพื่อการพัฒนาบริการของเราต่อไปนะคะ',
      tags: ['ปิดเคส', 'ประเมิน', 'CSAT'],
      isActive: true,
      businessScope: 'contact_center',
    },
  ],
  botRules: [
    {
      id: 'rule-cc-open-case',
      name: '[Contact Center] แจ้งปัญหา / ร้องเรียน / เปิดเคสใหม่',
      triggerType: 'keyword',
      keywords: ['แจ้งปัญหา', 'ร้องเรียน', 'เปิดเคส', 'ใช้งานไม่ได้', 'ระบบล่ม', 'ขัดข้อง', 'คอมเพลน'],
      matchType: 'contains',
      businessScope: 'contact_center',
      cannedResponseId: 'cr-cc-open-case',
      isActive: true,
      priority: 1,
    },
    {
      id: 'rule-cc-status',
      name: '[Contact Center] ติดตามสถานะเคส / เช็ค Ticket',
      triggerType: 'keyword',
      keywords: ['ตามเคส', 'สถานะเคส', 'เช็คเคส', 'เรื่องถึงไหน', 'ตามเรื่อง', 'tk-'],
      matchType: 'contains',
      businessScope: 'contact_center',
      cannedResponseId: 'cr-cc-case-status',
      isActive: true,
      priority: 2,
    },
    {
      id: 'rule-cc-escalate',
      name: '[Contact Center] ขอโอนสาย / ติดต่อแผนกเฉพาะทาง',
      triggerType: 'keyword',
      keywords: ['โอนสาย', 'ติดต่อฝ่าย', 'ขอคุยกับหัวหน้า', 'ผู้เชี่ยวชาญ', 'supervisor'],
      matchType: 'contains',
      businessScope: 'contact_center',
      cannedResponseId: 'cr-cc-escalate',
      isActive: true,
      priority: 3,
    },
    {
      id: 'rule-cc-csat',
      name: '[Contact Center] ประเมินความพึงพอใจ / ติชมบริการ',
      triggerType: 'keyword',
      keywords: ['ประเมิน', 'ให้คะแนน', 'ชมเชย', 'ติชม', 'ข้อเสนอแนะ', 'csat'],
      matchType: 'contains',
      businessScope: 'contact_center',
      cannedResponseId: 'cr-cc-csat',
      isActive: true,
      priority: 4,
    },
  ],
};
