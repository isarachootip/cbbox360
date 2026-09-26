export type TierType = 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type CreditGrade = 'A' | 'B' | 'C' | 'D';
export type ChannelType = 'LINE' | 'Facebook' | '3CX' | 'Web form' | 'Sales rep' | 'Email';

export interface Customer {
  id: string; // e.g. "C00123"
  name: string; // e.g. "สมชาย ใจดี"
  avatar?: string;
  initials: string;
  tier: TierType;
  creditGrade: CreditGrade;
  segments: string[]; // ['Champions', 'Good Payer', 'LINE Active']
  lifetimeValue: number; // 1284500
  spend12Months: number; // 186400
  orders12Months: number; // 27
  lastOrderDaysAgo: number; // 12
  lastOrderCode: string; // "SO-10482"
  lastOrderAmount: number; // 8950
  tierValidUntil: string; // "30 มิ.ย. 2027"
  tierProgressPercent: number; // 124
  tierTargetSpend: number; // 150000
  phone: string; // "081-xxx-5678"
  fullPhone: string; // "081-892-5678"
  email: string; // "somchai@example.com"
  channels: {
    line: boolean;
    facebook: boolean;
    email?: boolean;
    sms?: boolean;
  };
  birthday: string; // "14 ก.พ."
  customerSince: string; // "มี.ค. 2021"
  consent: {
    marketingLine: boolean;
    marketingEmail: boolean;
    marketingSms: boolean;
  };
  creditLimit: number; // 300000
  creditUsed: number; // 126000 (42%)
  creditOverdue: number; // 0
  churnRisk: 'ต่ำ' | 'ปานกลาง' | 'สูง';
  nextBestAction: {
    description: string;
    actionLabel: string;
  };
}

export type TimelineEventType = 'Order' | 'แชท' | 'โทร' | 'Ticket' | 'Deal' | 'Tier';

export interface TimelineEvent {
  id: string;
  customerId: string;
  type: TimelineEventType;
  iconCode: 'LN' | 'OR' | 'TL' | 'DL' | 'TK' | 'T↑' | 'T↓';
  title: string;
  time: string; // "วันนี้ 10:42", "14 ก.ย.", etc.
  detail: string;
  meta: string[]; // ["CSAT 5/5", "Sentiment บวก", "6 รายการ", etc.]
  linkText: string; // "เปิดใน Inbox", "เปิดใน Sales & Service", "เปิดใน Voice", etc.
  linkRoute: string;
  colorScheme: 'green' | 'blue' | 'purple' | 'amber' | 'teal';
}

export interface Deal {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  ownerName: string;
  ownerInitials: string;
  source: ChannelType;
  daysInStage: number;
  lostReason?: string;
  createdDate: string;
}

export type DealStage = 
  | 'Lead'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface Segment {
  id: string;
  name: string;
  group: 'RFM' | 'Lifecycle' | 'Service' | 'Credit' | 'สร้างเอง';
  type: 'Dynamic' | 'Static';
  memberCount: number;
  trend: string; // "+4%", "-3%"
  description?: string;
  rules?: SegmentRule[];
  tierBreakdown?: {
    gold: number;
    platinum: number;
    silver?: number;
    member?: number;
    totalSpend12M?: string;
  };
  webhookEnabled?: boolean;
}

export interface TierInfo {
  tier: TierType;
  sharePercent: number;
  memberCount: number;
  spendingRule: string;
  marketingBenefits: string;
  serviceBenefits: string;
}

export interface TierChangeLog {
  id: string;
  customerId: string;
  customerName: string;
  fromTier: TierType;
  toTier: TierType;
  direction: 'up' | 'down';
  reason: string;
  date: string;
}

export interface Ticket {
  id: string; // "TK-2310"
  customerId: string;
  customerName: string;
  customerTier: TierType;
  title: string;
  category: 'Complaint' | 'Inquiry' | 'Claim' | 'Request' | 'Billing' | 'Credit' | 'DSR';
  channel: ChannelType;
  status: 'Open' | 'Pending' | 'Waiting' | 'Closed';
  slaHoursLeft: number;
  slaFormatted: string; // "3 ชม.", "เกิน 25 นาที", "1 วัน"
  slaStatus: 'normal' | 'warning' | 'danger';
  assignee: string;
  createdAt: string;
  orderRef?: string;
  orderAmount?: number;
  slaTargetNote?: string;
  activityLogs: {
    time: string;
    author: string;
    text: string;
    type?: 'system' | 'workflow' | 'agent';
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'note';
  authorName?: string;
  text: string;
  time: string;
  isPrivateNote?: boolean;
  trackingNumber?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  customerTier: TierType;
  channel: 'LINE' | 'Facebook';
  channelAccount: string; // "CusShop Official"
  time: string;
  lastMessagePreview: string;
  label?: string; // "จัดส่ง", "ใบเสนอราคา", "เคลม", "เครดิต", "ทั่วไป"
  unreadCount?: number;
  status: 'Open' | 'Pending' | 'Snoozed' | 'Resolved';
  assignedTo: string; // "วิภา ส."
  team: string; // "Customer Care"
  messages: ChatMessage[];
  tabGroup: 'Mine' | 'Unassigned' | 'All';
}

export interface CreditAccount {
  id: string;
  customerId: string;
  customerName: string;
  grade: CreditGrade;
  limit: number;
  used: number;
  usedPercent: number;
  overdueAmount: number;
  aging: 'ปกติ' | '1–30 วัน' | '31–60 วัน' | '61–90 วัน' | '90+ วัน';
  nextAction: string;
}

export interface CreditLimitRequest {
  id: string;
  customerId: string;
  customerName: string;
  currentLimit: number;
  requestedLimit: number;
  sourceNote: string;
  onTimePaymentRate: number; // 98
  tier: TierType;
  grade: CreditGrade;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserProfile {
  name: string;
  initials: string;
  role: string;
  avatarBg?: string;
}
