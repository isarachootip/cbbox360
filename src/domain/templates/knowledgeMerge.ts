import {
  BusinessTemplatePreset,
  CompanyProfile,
  KnowledgeItem,
} from '../../types';

const PROFILE_KEYS: (keyof CompanyProfile)[] = [
  'companyName',
  'businessType',
  'description',
  'phone',
  'email',
  'lineId',
  'website',
  'address',
  'businessHoursText',
];

const GENERIC_DEFAULT_NAMES = new Set(['CusBox360', '']);

/**
 * Checks whether a field value in CompanyProfile is empty or still matches any template's preset value.
 */
const isPresetOrEmptyValue = (
  key: keyof CompanyProfile,
  value: string | undefined,
  templates: BusinessTemplatePreset[]
): boolean => {
  const trimmed = (value || '').trim();
  if (!trimmed || GENERIC_DEFAULT_NAMES.has(trimmed)) return true;
  return templates.some((t) => t.companyProfile[key].trim() === trimmed);
};

/**
 * Non-destructively merges a template's companyProfile into the current profile.
 * Admin-customized fields (companyName, phone, email, etc.) are preserved;
 * fields that are empty or match a template preset are updated to the new template.
 */
export const mergeCompanyProfile = (
  current: CompanyProfile | undefined,
  preset: BusinessTemplatePreset,
  allTemplates: BusinessTemplatePreset[]
): CompanyProfile => {
  if (!current) {
    return { ...preset.companyProfile };
  }

  const next: CompanyProfile = { ...current };
  for (const key of PROFILE_KEYS) {
    if (isPresetOrEmptyValue(key, current[key], allTemplates)) {
      next[key] = preset.companyProfile[key];
    }
  }
  return next;
};

/**
 * Returns knowledge items from the template preset whose id is not already in currentItems.
 */
export const selectNewKnowledgeItems = (
  currentItems: KnowledgeItem[],
  preset: BusinessTemplatePreset
): KnowledgeItem[] => {
  const existingIds = new Set(currentItems.map((item) => item.id));
  return preset.knowledgeItems.filter((item) => !existingIds.has(item.id));
};

/**
 * Removes knowledge items that originated from any template or trackedIds, keeping user-created items.
 */
export const removeTemplateKnowledgeItems = (
  currentItems: KnowledgeItem[],
  allTemplates: BusinessTemplatePreset[],
  trackedIds: string[]
): KnowledgeItem[] => {
  const templateOwnedIds = new Set([
    ...trackedIds,
    ...allTemplates.flatMap((t) => t.knowledgeItems.map((k) => k.id)),
  ]);
  return currentItems.filter((item) => !templateOwnedIds.has(item.id));
};

/**
 * Formats CompanyProfile and active KnowledgeItem[] into structured Thai text for AI Grounding.
 */
export const formatKnowledgeForPrompt = (
  profile?: CompanyProfile,
  items: KnowledgeItem[] = []
): string => {
  const lines: string[] = [];

  if (profile) {
    lines.push('### ข้อมูลบริษัทและช่องทางติดต่อ (Company Profile)');
    lines.push(`- ชื่อบริษัท/หน่วยงาน: ${profile.companyName}`);
    lines.push(`- ประเภทธุรกิจ: ${profile.businessType}`);
    lines.push(`- บริการและรายละเอียดธุรกิจ: ${profile.description}`);
    lines.push(`- เบอร์โทรศัพท์ติดต่อ: ${profile.phone}`);
    lines.push(`- อีเมลติดต่อ: ${profile.email}`);
    if (profile.lineId) lines.push(`- LINE Official: ${profile.lineId}`);
    if (profile.website) lines.push(`- เว็บไซต์: ${profile.website}`);
    if (profile.address) lines.push(`- ที่อยู่/สถานที่ตั้ง: ${profile.address}`);
    if (profile.businessHoursText) lines.push(`- เวลาทำการ: ${profile.businessHoursText}`);
  }

  const activeItems = items.filter((item) => item.isActive);
  if (activeItems.length > 0) {
    lines.push('\n### คลังความรู้และเงื่อนไขบริการ (Knowledge Base)');
    for (const item of activeItems) {
      lines.push(`- [${item.title}]: ${item.content}`);
    }
  }

  return lines.join('\n').trim();
};

/**
 * Matches customer inquiries about company name, business type, contact phone, email, or active KM items.
 */
export const matchKnowledgeOrCompanyReply = (
  userText: string,
  profile?: CompanyProfile,
  items: KnowledgeItem[] = []
): { matched: boolean; replyText: string; matchedTopic?: string } => {
  const clean = userText.trim().toLowerCase();
  if (!clean) return { matched: false, replyText: '' };

  if (
    profile &&
    /บริษัทชื่อ|ชื่ออะไร|ทำธุรกิจ|ธุรกิจอะไร|ติดต่อ|เบอร์โทร|อีเมล|email|ที่อยู่|ตั้งอยู่ที่ไหน/.test(clean)
  ) {
    return {
      matched: true,
      matchedTopic: 'Company Profile (ข้อมูลองค์กร)',
      replyText: `สวัสดีค่ะ เราคือ ${profile.companyName} ดำเนินธุรกิจ${profile.businessType} (${profile.description}) สามารถติดต่อได้ที่เบอร์โทร ${profile.phone}, อีเมล ${profile.email} หรือ LINE: ${profile.lineId || '-'} เวลาทำการ: ${profile.businessHoursText} ค่ะ`,
    };
  }

  for (const item of items.filter((k) => k.isActive)) {
    const titleHit = clean.includes(item.title.toLowerCase());
    const tagHit = (item.tags ?? []).some((t) => clean.includes(t.toLowerCase()));
    if (titleHit || tagHit) {
      return {
        matched: true,
        matchedTopic: `KM: ${item.title}`,
        replyText: item.content,
      };
    }
  }

  return { matched: false, replyText: '' };
};
