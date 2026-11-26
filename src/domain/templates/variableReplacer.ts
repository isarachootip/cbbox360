import { BusinessTemplateId, CompanyProfile, Conversation, Customer, Ticket } from '../../types';
import { IndustryProfile } from '../../types/industryProfile';
import { templateCompanyProfiles } from '../../data/templateKnowledgePresets';
import { buildIndustryVariables } from '../industry/industryVariables';

export const resolveActiveCompanyProfile = (
  activeBusiness: BusinessTemplateId,
  overrides?: Partial<Record<BusinessTemplateId, CompanyProfile>>
): CompanyProfile =>
  overrides?.[activeBusiness] ??
  templateCompanyProfiles[activeBusiness] ??
  templateCompanyProfiles.b2b_wholesale;

export const replaceTemplateVariables = (
  template: string,
  profile: CompanyProfile,
  customVars?: Record<string, string>
): string => {
  const defaultVars: Record<string, string> = {
    company_name: profile.companyName,
    company_phone: profile.phone,
    company_email: profile.email,
    company_address: profile.address,
    business_type: profile.businessType,
    customer_name: 'สมชาย ใจดี',
    order_code: 'SO-10482',
    tracking_no: 'TH2609-88412',
    agent_name: 'วิภา ส.',
    phone: '081-892-5678',
    credit_term: '30 วัน',
    hn_number: 'HN-6904812',
    doctor_name: 'นพ. กิตติพงศ์ วงศ์เวช',
    department: 'ศูนย์อายุรกรรมหัวใจ ชั้น 3',
    appoint_date: '22 ต.ค. 2026 เวลา 09:30 น.',
    courier_name: 'สมศักดิ์ (089-234-5678)',
    cod_amount: '2,450 บาท',
    license_plate: '1กข-9988 กรุงเทพฯ',
    mileage_km: '80,000 กม.',
    job_order_no: 'JO-2610-084',
    ticket_id: 'TK-2310',
    sla_time: 'ภายใน 1 ชั่วโมง',
    sla_tier: 'VIP (1 ชม.)',
    assigned_team: 'Tier 2 Escalation & VIP Desk',
    contract_ref: 'SLA-2026-0891',
    contract_no: 'SGF-690412',
    device_model: 'Samsung Galaxy S26 5G',
    installment_amt: '1,900 บาท',
    ptp_date: '30 พ.ย. 2026',
    ...customVars,
  };

  let result = template;
  for (const [key, val] of Object.entries(defaultVars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, val);
  }
  return result;
};

export const buildInboxCustomerVariables = (
  customer: Customer | undefined,
  conv: Conversation,
  tickets: Ticket[],
  industryProfile: IndustryProfile | null
): Record<string, string> => {
  const primaryContact = customer?.contacts?.find((c) => c.isPrimary);
  const resolvedFirstName =
    customer?.firstName ||
    primaryContact?.firstName ||
    conv.customerName.split(/\s+/)[0] ||
    conv.customerName;
  const openTicket = tickets.find((t) => t.customerId === customer?.id && t.status !== 'Closed');
  const ticketId = openTicket?.id || 'TK-2310';

  return {
    customer_name: conv.customerName,
    first_name: resolvedFirstName,
    nickname: customer?.nickname || primaryContact?.nickname || resolvedFirstName,
    order_code: customer?.lastOrderCode || 'SO-10482',
    tracking_no: 'TH2609-88412',
    agent_name: conv.assignedTo || 'วิภา ส.',
    phone: customer?.fullPhone || '081-892-5678',
    ticket_id: ticketId,
    ...buildIndustryVariables(industryProfile, { ticketId }),
  };
};
