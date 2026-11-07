export type KnowledgeCategory =
  | 'company_info'
  | 'services_products'
  | 'policies_sla'
  | 'payment_credit'
  | 'faq';

export interface CompanyProfile {
  companyName: string;
  businessType: string;
  description: string;
  phone: string;
  email: string;
  lineId: string;
  website: string;
  address: string;
  businessHoursText: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags?: string[];
  isActive: boolean;
  templateId?: 'hospital' | 'logistics' | 'auto_service' | 'b2b_wholesale';
}
