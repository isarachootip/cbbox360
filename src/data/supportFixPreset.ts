import { BusinessTemplatePreset, CompanyProfile, KnowledgeItem } from '../types';

export const supportFixCompanyProfile: CompanyProfile = {
  companyName: 'ศูนย์บริการ Support & Fix Helpdesk (IT & System Care)',
  businessType: 'ศูนย์รับแจ้งปัญหา ติดตามระบบงาน ซ่อมบำรุง และดูแลสัญญา MA (Helpdesk & Support)',
  description:
    'ให้บริการรับแจ้งปัญหาการใช้งานระบบงาน (ERP, POS, CRM, Web), ตรวจเช็คซ่อมบำรุงอุปกรณ์, ติดตามสถานะเคสแบบ Real-time พร้อมระบบควบคุม SLA ตามแพ็กเกจสัญญา MA และรองรับการเชื่อมโยงระบบ Helpdesk เดิม',
  phone: '02-099-3650 (Hotline 24 ชม. สำหรับลูกค้า Platinum)',
  email: 'helpdesk@supportfix360.co.th',
  lineId: '@supportfix360',
  website: 'https://www.supportfix360.co.th',
  address: '101 อาคารทรู ดิจิทัล พาร์ค ชั้น 14 ถ.สุขุมวิท แขวงบางจาก เขตพระโขนง กรุงเทพฯ 10260',
  businessHoursText: 'จันทร์ - เสาร์ 08:30 - 18:00 น. (แจ้งเหตุระบบล่มฉุกเฉิน 24 ชั่วโมง)',
};

export const supportFixKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'km-sf-sla',
    title: 'กรอบเวลา SLA ตามความรุนแรงและสัญญา MA',
    category: 'policies_sla',
    content:
      'Critical (ระบบล่ม/หยุดชะงัก): ตอบกลับภายใน 15 นาที แก้ไขใน 2 ชม. | High (Error งานหลัก): ตอบใน 30 นาที แก้ไขใน 4 ชม. | Normal (สอบถาม/ตั้งค่า): ตอบใน 1 ชม. ปิดงานใน 1 วันทำการ',
    tags: ['SLA', 'MA', 'ระบบล่ม', 'Critical'],
    isActive: true,
    templateId: 'support_fix',
    businessScope: 'support_fix',
  },
  {
    id: 'km-sf-remote',
    title: 'ขั้นตอนเตรียมเครื่องก่อนให้ทีมช่าง Remote ตรวจสอบปัญหา',
    category: 'services_products',
    content:
      'รบกวนลูกค้าเปิดโปรแกรม AnyDesk หรือ TeamViewer แล้วแจ้งหมายเลข ID 9 หลักพร้อมภาพหน้าจอ Error และช่วงเวลาที่พบปัญหา เพื่อให้ทีม Support L1/L2 ตรวจสอบได้รวดเร็วที่สุด',
    tags: ['Remote', 'AnyDesk', 'TeamViewer', 'ตรวจสอบปัญหา'],
    isActive: true,
    templateId: 'support_fix',
    businessScope: 'support_fix',
  },
  {
    id: 'km-sf-out-of-ma',
    title: 'แนวทางดูแลลูกค้าที่หมดสัญญา MA (Out-of-Warranty)',
    category: 'payment_credit',
    content:
      'กรณีสัญญา MA หมดอายุแล้ว สามารถเปิดเคสตรวจเช็คเบื้องต้นได้ตามปกติ หากต้องเข้าแก้ไขเชิงลึกหรือส่งช่าง On-site ทีมงานจะแจ้งใบเสนอราคาค่าบริการแบบรายครั้ง (Per-Incident) หรือเสนอต่ออายุ MA รายปีก่อนดำเนินการ',
    tags: ['MA หมดอายุ', 'Out-of-Warranty', 'ต่อสัญญา', 'ค่าบริการ'],
    isActive: true,
    templateId: 'support_fix',
    businessScope: 'support_fix',
  },
];

export const supportFixPreset: BusinessTemplatePreset = {
  id: 'support_fix',
  name: 'Support & Fix (Helpdesk)',
  thaiTitle: 'ศูนย์รับแจ้งปัญหา ติดตามระบบงาน และซ่อมบำรุง (Helpdesk)',
  tagline: 'เปิด Case ติดตามสถานะระบบงาน, แจ้งซ่อมอุปกรณ์, แจ้งเตือนสัญญา MA และรองรับผูก Helpdesk เดิม',
  description:
    'ชุดตั้งค่าสำหรับทีม IT Helpdesk และบริการซ่อมบำรุง เชื่อมหน้าแชท Inbox เข้ากับการเปิดเคส, ติดตามสถานะ 5 ขั้นตอน (Open → In Progress → Waiting → Resolved → Closed), แจ้งเตือน MA หมดอายุ และจองฟิลด์ External Ticket Ref สำหรับเชื่อมระบบเดิม',
  iconName: 'wrench',
  accentColor: 'blue',
  recommendedMenus: [
    'menu-customer360',
    'menu-inbox',
    'menu-canned-responses',
    'menu-cases',
    'menu-voice',
    'menu-consent',
  ],
  customVariables: [
    { key: 'company_code', label: 'รหัสลูกค้า/องค์กร', example: 'ST-2024-001' },
    { key: 'system_name', label: 'ระบบงาน/อุปกรณ์', example: 'ERP Billing' },
    { key: 'ticket_id', label: 'หมายเลข Case', example: 'CS-4001' },
    { key: 'sla_tier', label: 'ระดับ SLA', example: 'PLATINUM' },
  ],
  workflowHighlights: [
    'เปิด Case จากหน้าแชท LINE/Facebook หรือสายเข้า 3CX พร้อมระบุระบบงานและระดับความเร่งด่วนทันที',
    'แสดงแถบแจ้งเตือนอัตโนมัติเมื่อลูกค้าหมดสัญญา MA หรือใกล้หมดอายุบน Customer 360 และ Inbox',
    'รองรับการผูกเลขอ้างอิง Helpdesk ภายนอก (External Ticket Ref) เพื่อเตรียมพร้อมเชื่อม API/Webhook ในเฟสถัดไป',
  ],
  connectors: [],
  companyProfile: supportFixCompanyProfile,
  knowledgeItems: supportFixKnowledgeItems,
  cannedResponses: [
    {
      id: 'cr-sf-open-case',
      title: 'รับแจ้งปัญหาและแจ้งหมายเลข Case พร้อมกรอบเวลา SLA',
      shortcut: '/open-case',
      category: 'answer',
      content:
        'สวัสดีครับคุณ {customer_name} ทีม Support & Fix ได้รับแจ้งปัญหาระบบ {system_name} และเปิดเคสหมายเลข {ticket_id} เรียบร้อยแล้วครับ ทีมเทคนิคกำลังเร่งตรวจสอบและจะแจ้งความคืบหน้าให้ทราบโดยเร็วที่สุดครับ',
      tags: ['เปิดเคส', 'Helpdesk', 'แจ้งปัญหา'],
      isActive: true,
      businessScope: 'support_fix',
    },
    {
      id: 'cr-sf-check-case',
      title: 'อัปเดตสถานะการติดตามงานซ่อม / เคสระบบงาน',
      shortcut: '/check-case',
      category: 'answer',
      content:
        'อัปเดตสถานะเคส {ticket_id} (ระบบ {system_name}) ของคุณ {customer_name}: ขณะนี้ทีมเทคนิคอยู่ระหว่างการตรวจสอบและดำเนินการแก้ไข (In Progress) หากมีความคืบหน้าหรือแก้ไขเสร็จสิ้นจะรีบแจ้งกลับทันทีครับ',
      tags: ['ตามเคส', 'สถานะงานซ่อม', 'Helpdesk'],
      isActive: true,
      businessScope: 'support_fix',
    },
    {
      id: 'cr-sf-remote',
      title: 'ขอหมายเลข AnyDesk / TeamViewer เพื่อรีโมตตรวจสอบ',
      shortcut: '/remote-access',
      category: 'question',
      content:
        'เพื่อความรวดเร็วในการตรวจสอบอาการระบบ {system_name} รบกวนคุณ {customer_name} ส่ง 1) ภาพหน้าจอ Error ที่พบ 2) หมายเลข AnyDesk หรือ TeamViewer เข้ามาในแชทนี้เพื่อให้เจ้าหน้าที่รีโมตช่วยตรวจสอบได้เลยครับ',
      tags: ['Remote', 'AnyDesk', 'ขอข้อมูล'],
      isActive: true,
      businessScope: 'support_fix',
    },
    {
      id: 'cr-sf-onsite',
      title: 'แจ้งนัดหมายช่างเข้าหน้างาน (On-site Support)',
      shortcut: '/onsite-fix',
      category: 'question',
      content:
        'สำหรับเคส {ticket_id} ที่ต้องส่งช่างเทคนิคเข้าตรวจสอบอุปกรณ์หน้างาน รบกวนแจ้งวัน-เวลาที่สะดวกและชื่อผู้ประสานงานหน้างาน เพื่อให้ทีม Field Technician ยืนยันตารางเข้าบริการครับ',
      tags: ['On-site', 'แจ้งซ่อม', 'นัดช่าง'],
      isActive: true,
      businessScope: 'support_fix',
    },
    {
      id: 'cr-sf-close',
      title: 'แจ้งแก้ไขเรียบร้อยและขอปิดเคส',
      shortcut: '/close-case',
      category: 'answer',
      content:
        'เคสหมายเลข {ticket_id} (ระบบ {system_name}) ได้รับการแก้ไขเรียบร้อยแล้วครับ รบกวนคุณ {customer_name} ทดสอบใช้งานอีกครั้ง หากใช้งานได้ปกติแล้วขออนุญาตปิดเคสและขอบคุณที่ใช้บริการ Support & Fix ครับ',
      tags: ['ปิดเคส', 'แก้ไขแล้ว', 'Helpdesk'],
      isActive: true,
      businessScope: 'support_fix',
    },
  ],
  botRules: [
    {
      id: 'rule-sf-outage',
      name: '[Support & Fix] แจ้งระบบล่ม / ขึ้น Error / ใช้งานไม่ได้',
      triggerType: 'keyword',
      keywords: ['ระบบล่ม', 'error', 'เข้าไม่ได้', 'ค้าง', 'แจ้งปัญหา', 'บั๊ก', 'bug'],
      matchType: 'contains',
      businessScope: 'support_fix',
      cannedResponseId: 'cr-sf-open-case',
      isActive: true,
      priority: 1,
    },
    {
      id: 'rule-sf-status',
      name: '[Support & Fix] ติดตามสถานะเคส / ตามงานซ่อม',
      triggerType: 'keyword',
      keywords: ['ตามงาน', 'ตามเคส', 'สถานะเคส', 'งานซ่อมถึงไหน', 'เช็คเคส', 'cs-'],
      matchType: 'contains',
      businessScope: 'support_fix',
      cannedResponseId: 'cr-sf-check-case',
      isActive: true,
      priority: 2,
    },
    {
      id: 'rule-sf-remote',
      name: '[Support & Fix] ขอรีโมตช่วยเหลือ / AnyDesk',
      triggerType: 'keyword',
      keywords: ['รีโมต', 'remote', 'anydesk', 'teamviewer'],
      matchType: 'contains',
      businessScope: 'support_fix',
      cannedResponseId: 'cr-sf-remote',
      isActive: true,
      priority: 3,
    },
  ],
};
