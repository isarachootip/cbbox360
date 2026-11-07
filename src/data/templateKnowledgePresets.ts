import { BusinessTemplateId, CompanyProfile, KnowledgeItem } from '../types';

export const templateCompanyProfiles: Record<BusinessTemplateId, CompanyProfile> = {
  b2b_wholesale: {
    companyName: 'บจก. คัสบอกซ์ สามหกศูนย์ (CusBox360)',
    businessType: 'ธุรกิจค้าส่งเครื่องพิมพ์อุตสาหกรรม หมึกพิมพ์แท้ และอุปกรณ์สำนักงานครบวงจร (B2B Wholesale)',
    description:
      'ผู้จัดจำหน่ายและให้เช่าเครื่องพิมพ์อุตสาหกรรม หมึกพิมพ์แท้ (Toner/Ink) กระดาษ และวัสดุสำนักงานสำหรับองค์กร โรงงาน และตัวแทนจำหน่าย พร้อมบริการสินเชื่อการค้า (Credit Term 30-60 วัน)',
    phone: '02-123-4567, 081-892-5678',
    email: 'sales@cusbox360.co.th',
    lineId: '@cusbox360',
    website: 'https://www.cusbox360.co.th',
    address: '88 อาคารสาทรสแควร์ ชั้น 15 ถ.สาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    businessHoursText: 'จันทร์ - ศุกร์ 08:30 - 18:00 น., เสาร์ 09:00 - 16:00 น. (หยุดวันอาทิตย์และวันหยุดนักขัตฤกษ์)',
  },
  hospital: {
    companyName: 'โรงพยาบาลและศูนย์การแพทย์ สมิติเวชช์ แคร์ (CarePlus Hospital)',
    businessType: 'โรงพยาบาลเอกชน คลินิกเฉพาะทาง และศูนย์ตรวจสุขภาพครบวงจร (Hospital & Healthcare)',
    description:
      'ให้บริการตรวจรักษาโรคทั่วไป คลินิกเฉพาะทาง (อายุรกรรมหัวใจ, กระดูกและข้อ, กุมารเวช) ศูนย์ตรวจสุขภาพประจำปี บริการนัดหมายแพทย์ออนไลน์ และตรวจสอบสิทธิ์ประกันสุขภาพ/ประกันสังคม',
    phone: '02-099-8888 (สายด่วนฉุกเฉิน 1669)',
    email: 'contact@careplushospital.co.th',
    lineId: '@careplushospital',
    website: 'https://www.careplushospital.co.th',
    address: '199 ถ.สุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    businessHoursText: 'แผนกผู้ป่วยนอก (OPD) เปิดทุกวัน 07:00 - 20:00 น. / แผนกฉุกเฉินเปิดตลอด 24 ชั่วโมง',
  },
  logistics: {
    companyName: 'บจก. สปีดเอ็กซ์เพรส โลจิสติกส์ (SpeedXpress 3PL & Fleet)',
    businessType: 'บริการขนส่งพัสดุด่วน โลจิสติกส์เหมาคัน และคลังสินค้าครบวงจร (Logistics & Fulfillment)',
    description:
      'ให้บริการจัดส่งพัสดุด่วนทั่วประเทศ (Next-Day Delivery) บริการเก็บเงินปลายทาง (COD) รถขนส่งเหมาคัน (4 ล้อ / 6 ล้อ / ห้องเย็น) และคลังสินค้าแพ็กของอัตโนมัติ (Fulfillment)',
    phone: '02-777-9000',
    email: 'cs@speedxpress.co.th',
    lineId: '@speedxpress',
    website: 'https://www.speedxpress.co.th',
    address: '55/8 นิคมอุตสาหกรรมบางพลี ถ.บางนา-ตราด กม.23 อ.บางเสาธง จ.สมุทรปราการ 10540',
    businessHoursText: 'ศูนย์บริการลูกค้าเปิดทุกวัน 08:00 - 20:00 น. (เรียกรถเข้ารับพัสดุตัดรอบ 14:00 น.)',
  },
  auto_service: {
    companyName: 'ศูนย์บริการรถยนต์ ออโต้โปร เซอร์วิส (AutoPro Service Center)',
    businessType: 'ศูนย์บริการเช็คระยะ ซ่อมบำรุงรถยนต์ มาตรฐานครบวงจร และตัวแทนต่อประกันภัยรถยนต์',
    description:
      'ให้บริการเช็คระยะตามเลขไมล์ เปลี่ยนถ่ายน้ำมันเครื่อง ช่วงล่าง เบรค แบตเตอรี่ ยางรถยนต์ ซ่อมสีและตัวถัง รวมถึงบริการต่ออายุประกันภัยรถยนต์และ พ.ร.บ. ออนไลน์',
    phone: '02-555-3400, 089-444-5566',
    email: 'service@autoprocenter.co.th',
    lineId: '@autoproservice',
    website: 'https://www.autoprocenter.co.th',
    address: '320 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    businessHoursText: 'จันทร์ - เสาร์ 08:00 - 18:00 น. (หยุดวันอาทิตย์)',
  },
};

export const templateKnowledgeItems: Record<BusinessTemplateId, KnowledgeItem[]> = {
  b2b_wholesale: [
    {
      id: 'km-b2b-products',
      title: 'สินค้าและบริการหลัก (เครื่องพิมพ์และหมึกพิมพ์ B2B)',
      category: 'services_products',
      content:
        'จำหน่ายเครื่องพิมพ์อุตสาหกรรมและสำนักงาน (รุ่น Pro ราคาเริ่มต้น 45,000 บาท/เครื่อง), หมึกพิมพ์แท้ (Toner/Ink), กระดาษและวัสดุสิ้นเปลืองสำนักงาน พร้อมบริการติดตั้งและดูแลรักษารายปี',
      tags: ['สินค้า', 'เครื่องพิมพ์', 'หมึกพิมพ์', 'ราคา'],
      isActive: true,
      templateId: 'b2b_wholesale',
    },
    {
      id: 'km-b2b-shipping',
      title: 'รอบจัดส่งสินค้าและการตัดรอบบิล',
      category: 'policies_sla',
      content:
        'ตัดรอบจัดส่งจันทร์ - เสาร์ เวลา 12:00 น. (กทม./ปริมณฑล จัดส่งภายใน 1 วันทำการ, ต่างจังหวัด 1-2 วันทำการ) ผ่านขนส่ง Flash Express และ Kerry Express',
      tags: ['จัดส่ง', 'ตัดรอบ', 'ขนส่ง'],
      isActive: true,
      templateId: 'b2b_wholesale',
    },
    {
      id: 'km-b2b-warranty',
      title: 'นโยบายการรับประกันและเคลมสินค้า',
      category: 'policies_sla',
      content:
        'สินค้ารับประกันศูนย์ไทย 1 ปีเต็ม หากพบปัญหาจากการผลิตภายใน 7 วัน เปลี่ยนตัวใหม่ทันที (ต้องมีรูปถ่ายกล่องพัสดุ ป้ายจ่าหน้า และคลิปวิดีโอจุดชำรุด)',
      tags: ['ประกัน', 'เคลม', 'เปลี่ยนสินค้า'],
      isActive: true,
      templateId: 'b2b_wholesale',
    },
    {
      id: 'km-b2b-credit',
      title: 'เงื่อนไขการขอวงเงินสินเชื่อการค้า (Credit Term 30-60 วัน)',
      category: 'payment_credit',
      content:
        'สำหรับลูกค้าองค์กรที่มียอดสั่งซื้อต่อเนื่องอย่างน้อย 3 เดือน หรือเกรดเครดิต B ขึ้นไป ใช้เอกสาร ภ.พ.20, หนังสือรับรองบริษัท (ไม่เกิน 3 เดือน) และ Statement ย้อนหลัง 6 เดือน พิจารณา 1-3 วันทำการ',
      tags: ['เครดิต', 'วางบิล', 'สินเชื่อ'],
      isActive: true,
      templateId: 'b2b_wholesale',
    },
  ],
  hospital: [
    {
      id: 'km-hosp-services',
      title: 'แผนกและศูนย์การแพทย์ที่เปิดให้บริการ',
      category: 'services_products',
      content:
        'เปิดให้บริการศูนย์อายุรกรรมหัวใจ (ชั้น 3), ศูนย์ตรวจสุขภาพประจำปี (ชั้น 2), แผนกกุมารเวช, แผนกกระดูกและข้อ และคลินิกทันตกรรม สามารถแจ้งชื่อแพทย์หรืออาการเพื่อนัดหมายล่วงหน้าได้',
      tags: ['แผนก', 'ตรวจสุขภาพ', 'นัดแพทย์'],
      isActive: true,
      templateId: 'hospital',
    },
    {
      id: 'km-hosp-insure',
      title: 'การใช้สิทธิ์ประกันสุขภาพและประกันสังคม',
      category: 'payment_credit',
      content:
        'รองรับสิทธิ์ประกันสุขภาพเอกชนชั้นนำทุกแห่ง (ไม่ต้องสำรองจ่ายตามเงื่อนไขกรมธรรม์) และสิทธิ์ประกันสังคม โดยผู้ป่วยสามารถส่งภาพบัตรประชาชนและบัตรประกันทางแชทเพื่อเช็คสิทธิ์ล่วงหน้า',
      tags: ['ประกันสุขภาพ', 'ประกันสังคม', 'เช็คสิทธิ์'],
      isActive: true,
      templateId: 'hospital',
    },
    {
      id: 'km-hosp-prep',
      title: 'การเตรียมตัวก่อนตรวจสุขภาพและการรับผลแล็บ',
      category: 'policies_sla',
      content:
        'กรุณางดน้ำและอาหารอย่างน้อย 8-12 ชั่วโมงก่อนเจาะเลือด (จิบน้ำเปล่าได้เล็กน้อย) ผลตรวจสุขภาพจะจัดส่งผ่านระบบปลอดภัยตามมาตรฐาน PDPA ภายใน 24-48 ชั่วโมง',
      tags: ['ตรวจสุขภาพ', 'งดน้ำอาหาร', 'ผลแล็บ'],
      isActive: true,
      templateId: 'hospital',
    },
  ],
  logistics: [
    {
      id: 'km-logis-services',
      title: 'บริการขนส่งพัสดุด่วนและรถเหมาคัน (Fleet)',
      category: 'services_products',
      content:
        'ให้บริการส่งพัสดุด่วนทั่วไทยเริ่มต้น 35 บาท, บริการเรียกรถเข้ารับพัสดุถึงหน้าบ้าน/คลังสินค้าฟรีไม่มีขั้นต่ำ และบริการรถขนส่งเหมาคัน 4 ล้อ/6 ล้อพร้อมประกันสินค้า',
      tags: ['ขนส่ง', 'เรียกรถ', 'ค่าส่ง'],
      isActive: true,
      templateId: 'logistics',
    },
    {
      id: 'km-logis-cod',
      title: 'เงื่อนไขเก็บเงินปลายทาง (COD) และรอบโอนเงินคืน',
      category: 'payment_credit',
      content:
        'ค่าธรรมเนียมเก็บเงินปลายทาง (COD) เพียง 2% โอนเงินคืนเข้าบัญชีผู้ส่งภายใน 1 วันทำการ (T+1) หลังจากพัสดุจัดส่งสำเร็จ พร้อมรายงานสรุปยอดรายวัน',
      tags: ['COD', 'เก็บเงินปลายทาง', 'โอนเงิน'],
      isActive: true,
      templateId: 'logistics',
    },
    {
      id: 'km-logis-claim',
      title: 'การติดตามพัสดุตกค้างและเงื่อนไขเคลมพัสดุเสียหาย',
      category: 'policies_sla',
      content:
        'คุ้มครองพัสดุสูญหายหรือเสียหายสูงสุด 2,000 บาทต่อชิ้น (หรือตามวงเงินประกันเสริมสูงสุด 50,000 บาท) แจ้งเคลมภายใน 7 วันหลังได้รับพัสดุพร้อมภาพถ่ายกล่องและสินค้า',
      tags: ['เคลมพัสดุ', 'ของหาย', 'ตามของ'],
      isActive: true,
      templateId: 'logistics',
    },
  ],
  auto_service: [
    {
      id: 'km-auto-services',
      title: 'บริการเช็คระยะตามเลขไมล์และซ่อมบำรุงรถยนต์',
      category: 'services_products',
      content:
        'รับเช็คระยะทุกๆ 10,000 กม. เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์แท้ 100% ตรวจเช็คระบบเบรค ช่วงล่าง แบตเตอรี่ และแอร์รถยนต์ ฟรีตรวจเช็คสภาพรถ 24 รายการ',
      tags: ['เช็คระยะ', 'น้ำมันเครื่อง', 'ซ่อมรถ'],
      isActive: true,
      templateId: 'auto_service',
    },
    {
      id: 'km-auto-warranty',
      title: 'การรับประกันงานซ่อมและอะไหล่แท้',
      category: 'policies_sla',
      content:
        'รับประกันงานซ่อมและอะไหล่แท้ศูนย์นาน 6 เดือน หรือ 10,000 กม. (อย่างใดอย่างหนึ่งถึงก่อน) ลูกค้าสามารถเช็คสถานะใบสั่งซ่อม (Job Order) และเวลารับรถผ่านแชทได้ตลอดเวลา',
      tags: ['ประกันงานซ่อม', 'อะไหล่', 'รับรถ'],
      isActive: true,
      templateId: 'auto_service',
    },
    {
      id: 'km-auto-insure',
      title: 'บริการผ่อนชำระ 0% และต่อประกันภัยรถยนต์/พ.ร.บ.',
      category: 'payment_credit',
      content:
        'รองรับการผ่อนชำระค่าซ่อมและยางรถยนต์ 0% นานสูงสุด 6-10 เดือนกับบัตรเครดิตที่ร่วมรายการ พร้อมบริการเปรียบเทียบเบี้ยและต่อประกันภัยรถยนต์ชั้น 1, 2+, 3+',
      tags: ['ผ่อน 0%', 'ต่อประกัน', 'พรบ'],
      isActive: true,
      templateId: 'auto_service',
    },
  ],
};

export const defaultCompanyProfile: CompanyProfile = templateCompanyProfiles.b2b_wholesale;
export const defaultKnowledgeItems: KnowledgeItem[] = templateKnowledgeItems.b2b_wholesale;
