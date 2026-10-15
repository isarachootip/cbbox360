import { ConnectorConfig } from '../types';

export const hospitalConnectors: ConnectorConfig[] = [
  {
    id: 'conn-his-fhir',
    name: 'HIS / EMR Gateway (HL7 FHIR)',
    iconName: 'hospital',
    category: 'industry',
    accountName: 'Hospital Information System (FHIR v4)',
    accountId: 'his.fhir.gateway.01',
    status: 'connected',
    statusText: 'เชื่อมต่อแล้ว (Patient HN & Appointment Sync)',
    lastSync: 'เพิ่งซิงก์เมื่อสักครู่',
    messagesCountToday: 194,
    description: 'เชื่อมต่อฐานข้อมูลโรงพยาบาล (HIS/EMR) ดึงข้อมูลผู้ป่วย HN, ประวัติการแพ้ยา, ตารางออกตรวจของแพทย์ และสถานะคิวห้องตรวจ',
    webhookUrl: 'https://api.cb360.co.th/v1/webhooks/industry/his-fhir',
    appId: 'HIS_FHIR_PROD_092',
    features: [
      { key: 'hn_lookup', label: 'ค้นหาและผูกโปรไฟล์ผู้ป่วยด้วยเลข HN / บัตรประชาชน', enabled: true },
      { key: 'appoint_sync', label: 'ซิงก์ตารางนัดหมายแพทย์และส่งแจ้งเตือนล่วงหน้า 24 ชม.', enabled: true },
      { key: 'lab_notify', label: 'แจ้งเตือนเมื่อผลตรวจสุขภาพ/ผลแล็บออกพร้อมลิงก์ยืนยันตัวตน', enabled: true },
    ],
  },
  {
    id: 'conn-health-insure',
    name: 'Insurance & Claim Eligibility API',
    iconName: 'shield',
    category: 'industry',
    accountName: 'Health Claim Network (OPD/IPD)',
    accountId: 'insure.claim.net',
    status: 'connected',
    statusText: 'เชื่อมต่อแล้ว (Real-time Policy Check)',
    lastSync: '10 นาทีที่แล้ว',
    messagesCountToday: 68,
    description: 'ระบบตรวจสอบสิทธิ์ประกันสุขภาพเอกชน ประกันกลุ่ม และประกันสังคมแบบ Real-time พร้อมประเมินวงเงินคุ้มครองเบื้องต้น',
    webhookUrl: 'https://api.cb360.co.th/v1/webhooks/industry/insurance-check',
    appId: 'CLAIM_NET_881',
    features: [
      { key: 'policy_verify', label: 'เช็คสิทธิ์ความคุ้มครอง OPD/IPD จากเลขกรมธรรม์', enabled: true },
      { key: 'pre_arrange', label: 'ส่งเอกสาร Pre-Arrangement ประเมินค่าผ่าตัดเข้า Case', enabled: true },
    ],
  },
];

export const logisticsConnectors: ConnectorConfig[] = [
  {
    id: 'conn-logistics-tms',
    name: 'TMS & Multi-Carrier Tracking API',
    iconName: 'truck',
    category: 'industry',
    accountName: 'Express Tracking Hub (Kerry/Flash/J&T/Fleet)',
    accountId: 'tms.hub.express',
    status: 'connected',
    statusText: 'เชื่อมต่อแล้ว (Real-time Webhook)',
    lastSync: '2 นาทีที่แล้ว',
    messagesCountToday: 412,
    description: 'เชื่อมต่อระบบบริหารการขนส่ง (TMS) และผู้ให้บริการขนส่งชั้นนำ เพื่อดึงสถานะพัสดุ พิกัดรถขนส่ง และหลักฐานการเซ็นรับ (POD)',
    webhookUrl: 'https://api.cb360.co.th/v1/webhooks/industry/tms-tracking',
    appId: 'TMS_HUB_2026',
    features: [
      { key: 'live_tracking', label: 'ดึงสถานะพัสดุและรูปลายเซ็นรับของ (POD) แสดงใน Customer 360', enabled: true },
      { key: 'pickup_booking', label: 'รับคำสั่งจองรถเข้ารับพัสดุ (Pickup Request) จากแชทเข้า TMS', enabled: true },
      { key: 'failed_delivery_alert', label: 'เปิด Ticket อัตโนมัติเมื่อนำจ่ายไม่สำเร็จเกิน 2 ครั้ง', enabled: true },
    ],
  },
];

export const autoServiceConnectors: ConnectorConfig[] = [
  {
    id: 'conn-auto-dms',
    name: 'DMS / Workshop & Parts Management API',
    iconName: 'car',
    category: 'industry',
    accountName: 'AutoPro DMS & Garage Cloud',
    accountId: 'dms.autopro.cloud',
    status: 'connected',
    statusText: 'เชื่อมต่อแล้ว (Job Order & Vehicle Sync)',
    lastSync: '5 นาทีที่แล้ว',
    messagesCountToday: 112,
    description: 'เชื่อมต่อระบบบริหารศูนย์บริการรถยนต์ (DMS) ซิงก์ข้อมูลทะเบียนรถ เลขไมล์ สถานะใบสั่งซ่อม (Job Order) และสต็อกอะไหล่',
    webhookUrl: 'https://api.cb360.co.th/v1/webhooks/industry/auto-dms',
    appId: 'DMS_AUTO_774',
    features: [
      { key: 'vehicle_profile', label: 'ซิงก์ข้อมูลทะเบียนรถ เลขตัวถัง (VIN) และประวัติเช็คระยะเข้า CDP', enabled: true },
      { key: 'job_status_push', label: 'ส่งแจ้งเตือน LINE อัตโนมัติเมื่อรถซ่อมเสร็จพร้อมรับ', enabled: true },
      { key: 'service_reminder', label: 'แจ้งเตือนเมื่อครบกำหนดเช็คระยะ 10,000 กม. หรือครบ 6 เดือน', enabled: true },
    ],
  },
];
