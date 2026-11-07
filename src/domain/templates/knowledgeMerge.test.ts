import { describe, expect, it } from 'vitest';
import { businessTemplates } from '../../data/businessTemplates';
import { defaultCompanyProfile, defaultKnowledgeItems } from '../../data/templateKnowledgePresets';
import {
  formatKnowledgeForPrompt,
  mergeCompanyProfile,
  removeTemplateKnowledgeItems,
  selectNewKnowledgeItems,
} from './knowledgeMerge';
import { CompanyProfile, KnowledgeItem } from '../../types';

const hospitalPreset = businessTemplates.find((t) => t.id === 'hospital')!;
const logisticsPreset = businessTemplates.find((t) => t.id === 'logistics')!;

describe('knowledgeMerge domain functions', () => {
  it('replaces template-default companyProfile fields when switching templates', () => {
    const merged = mergeCompanyProfile(defaultCompanyProfile, hospitalPreset, businessTemplates);
    expect(merged.companyName).toBe(hospitalPreset.companyProfile.companyName);
    expect(merged.phone).toBe(hospitalPreset.companyProfile.phone);
    expect(merged.email).toBe(hospitalPreset.companyProfile.email);
    expect(merged.businessType).toBe(hospitalPreset.companyProfile.businessType);
  });

  it('preserves admin-customized companyName, phone, and email when applying a template', () => {
    const customProfile: CompanyProfile = {
      ...defaultCompanyProfile,
      companyName: 'บจก. สยามเมดิคอล กรุ๊ป',
      phone: '02-888-9999',
      email: 'info@siammedical.co.th',
    };

    const merged = mergeCompanyProfile(customProfile, hospitalPreset, businessTemplates);
    expect(merged.companyName).toBe('บจก. สยามเมดิคอล กรุ๊ป');
    expect(merged.phone).toBe('02-888-9999');
    expect(merged.email).toBe('info@siammedical.co.th');
    // Uncustomized template fields update to the new template
    expect(merged.businessType).toBe(hospitalPreset.companyProfile.businessType);
    expect(merged.description).toBe(hospitalPreset.companyProfile.description);
  });

  it('selects only knowledge items not already present by id', () => {
    const existing: KnowledgeItem[] = [hospitalPreset.knowledgeItems[0]];
    const added = selectNewKnowledgeItems(existing, hospitalPreset);
    expect(added).toHaveLength(hospitalPreset.knowledgeItems.length - 1);
    expect(added.some((k) => k.id === hospitalPreset.knowledgeItems[0].id)).toBe(false);
  });

  it('removes template knowledge items on reset while preserving user-created KM items', () => {
    const customItem: KnowledgeItem = {
      id: 'km-custom-1',
      title: 'นโยบายส่วนลดพิเศษลูกค้า VIP',
      category: 'payment_credit',
      content: 'ลดเพิ่ม 10% เมื่อสั่งซื้อครบ 50,000 บาท',
      isActive: true,
    };
    const combined: KnowledgeItem[] = [
      ...defaultKnowledgeItems,
      ...hospitalPreset.knowledgeItems,
      ...logisticsPreset.knowledgeItems,
      customItem,
    ];

    const remaining = removeTemplateKnowledgeItems(
      combined,
      businessTemplates,
      hospitalPreset.knowledgeItems.map((k) => k.id)
    );

    expect(remaining).toEqual([customItem]);
  });

  it('formats companyProfile and active knowledgeItems for AI system prompt', () => {
    const items: KnowledgeItem[] = [
      ...hospitalPreset.knowledgeItems,
      {
        id: 'km-inactive',
        title: 'หัวข้อที่ปิดใช้งาน',
        category: 'faq',
        content: 'ไม่ควรแสดงใน Prompt',
        isActive: false,
      },
    ];

    const formatted = formatKnowledgeForPrompt(hospitalPreset.companyProfile, items);
    expect(formatted).toContain(hospitalPreset.companyProfile.companyName);
    expect(formatted).toContain(hospitalPreset.companyProfile.phone);
    expect(formatted).toContain(hospitalPreset.companyProfile.email);
    expect(formatted).toContain(hospitalPreset.knowledgeItems[0].title);
    expect(formatted).not.toContain('ไม่ควรแสดงใน Prompt');
  });
});
