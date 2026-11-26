import { CompanyProfile, KnowledgeItem } from '../types';

export const consumerFinanceCompanyProfile: CompanyProfile = {
  companyName: 'บมจ. ซิงเกอร์ประเทศไทย และ บมจ. เอสจี แคปปิตอล (SINGER & SG Capital)',
  businessType: 'ธุรกิจเช่าซื้อเครื่องใช้ไฟฟ้า สินเชื่อผ่อนมือถือล็อกเครื่อง (SG Finance+) และสินเชื่อรถทำเงิน',
  description:
    'ให้บริการจำหน่ายเครื่องใช้ไฟฟ้าในบ้านและเชิงพาณิชย์ (ตู้แช่ แอร์ เครื่องซักผ้า) ทั้งเงินสดและเงินผ่อน ควบคู่กับสินเชื่อผ่อนสมาร์ทโฟนใช้บัตรประชาชนใบเดียว SG Finance+ (Cloud Lock) สินเชื่อจำนำทะเบียนรถทำเงิน และระบบบริหารติดตามค่างวดมาตรฐาน พ.ร.บ.ทวงถามหนี้',
  phone: '02-234-7171 (SINGER Care) / 02-028-2828 (SG Capital)',
  email: 'contactcenter@sgcapital.co.th',
  lineId: '@sgfinanceplus',
  website: 'https://www.sgcapital.co.th',
  address: '72 อาคาร กสท โทรคมนาคม ชั้น 17-20 ถ.เจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500',
  businessHoursText: 'จันทร์ - อาทิตย์ 08:30 - 19:00 น. (ฝ่ายติดตามหนี้ติดต่อเฉพาะเวลาตาม พ.ร.บ.ทวงถามหนี้)',
};

export const consumerFinanceKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'km-cf-sgfinance',
    title: 'เงื่อนไขสมัคร SG Finance+ ผ่อนมือถือใช้บัตรประชาชนใบเดียว',
    category: 'services_products',
    content:
      'สมัครผ่อนสมาร์ทโฟนแบรนด์ชั้นนำ (Samsung, OPPO, Vivo, Xiaomi, Realme) ใช้เพียงบัตรประชาชนตัวจริงใบเดียว ไม่ต้องใช้บัตรเครดิต ไม่ต้องมีสลิปเงินเดือน อายุ 20-65 ปี ดาวน์เริ่มต้น 10% รู้ผลอนุมัติไวใน 3 นาทีที่ร้านพาร์ทเนอร์ทั่วประเทศ ผ่อนนานสูงสุด 24 เดือน',
    tags: ['SG Finance+', 'ผ่อนมือถือ', 'บัตรประชาชนใบเดียว', 'สมัครสินเชื่อ'],
    isActive: true,
    templateId: 'consumer_finance',
    businessScope: 'consumer_finance',
  },
  {
    id: 'km-cf-unlock',
    title: 'การปลดล็อกหน้าจอมือถืออัตโนมัติ (Cloud Lock) หลังชำระค่างวด',
    category: 'policies_sla',
    content:
      'กรณีเครื่องถูกล็อกชั่วคราวเนื่องจากค้างชำระ เมื่อลูกค้าสแกนจ่ายผ่าน QR Bill Payment ตรงตามยอดค้างและเชื่อมต่ออินเทอร์เน็ต Wi-Fi/มือถือ เครื่องจะปลดล็อกอัตโนมัติใน 5-15 นาที หากยังไม่ปลดล็อกให้ส่งสลิปพร้อมเลขสัญญาเพื่อเปิดเคสด่วน (SLA 60 นาที)',
    tags: ['ปลดล็อกเครื่อง', 'Cloud Lock', 'SG Finance+', 'ค่างวด'],
    isActive: true,
    templateId: 'consumer_finance',
    businessScope: 'consumer_finance',
  },
  {
    id: 'km-cf-singer-loan',
    title: 'สินเชื่อเช่าซื้อเครื่องใช้ไฟฟ้า SINGER และสินเชื่อรถทำเงิน',
    category: 'services_products',
    content:
      'SINGER จำหน่ายตู้แช่เครื่องดื่ม ตู้แช่แข็ง แอร์ และเครื่องซักผ้าหยอดเหรียญทั้งเงินสดและเงินผ่อนพร้อมบริการช่าง SINGER Care ถึงหน้างาน ส่วนสินเชื่อรถทำเงินรับจำนำทะเบียนรถบรรทุก 4-10 ล้อและรถยนต์ ไม่ต้องจอดรถ วงเงินสูงสุดตามราคาประเมิน',
    tags: ['SINGER', 'ตู้แช่', 'รถทำเงิน', 'จำนำทะเบียน'],
    isActive: true,
    templateId: 'consumer_finance',
    businessScope: 'consumer_finance',
  },
  {
    id: 'km-cf-collection-act',
    title: 'มาตรฐานการโทรติดตามค่างวดและนัดชำระ (PTP) ตาม พ.ร.บ.การทวงถามหนี้',
    category: 'payment_credit',
    content:
      'เจ้าหน้าที่โทรออกติดตามค่างวดได้เฉพาะ จันทร์-ศุกร์ 08:00-20:00 น. และวันหยุดราชการ 08:00-18:00 น. ไม่เกิน 1 ครั้งต่อวัน ต้องแจ้งชื่อ-บริษัทชัดเจน ห้ามเปิดเผยหนี้แก่บุคคลที่สาม และบันทึกวันนัดชำระ (Promise-to-Pay: PTP) ลงระบบทุกครั้ง',
    tags: ['ทวงถามหนี้', 'PTP', 'ติดตามค่างวด', 'พ.ร.บ.ทวงถามหนี้'],
    isActive: true,
    templateId: 'consumer_finance',
    businessScope: 'consumer_finance',
  },
];
