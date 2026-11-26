/**
 * templateSeedLoader.js — Non-destructively seeds initial tenant contacts, custom fields,
 * and omnichannel conversations from `templates/<id>/seed.yaml`.
 */
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

export const loadTemplateSeedBundle = (
  templateId,
  templatesDir = path.resolve(process.cwd(), 'templates')
) => {
  if (!templateId) {
    return {
      contacts: [],
      conversations: [],
      tickets: [],
      timelineEvents: [],
      deals: [],
      creditAccounts: [],
      creditRequests: [],
      callLogs: [],
    };
  }
  const seedPath = path.join(templatesDir, String(templateId), 'seed.yaml');
  if (!fs.existsSync(seedPath)) {
    return {
      contacts: [],
      conversations: [],
      tickets: [],
      timelineEvents: [],
      deals: [],
      creditAccounts: [],
      creditRequests: [],
      callLogs: [],
    };
  }
  try {
    const parsed = parseYaml(fs.readFileSync(seedPath, 'utf8')) || {};
    return {
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      timelineEvents: Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [],
      deals: Array.isArray(parsed.deals) ? parsed.deals : [],
      creditAccounts: Array.isArray(parsed.creditAccounts) ? parsed.creditAccounts : [],
      creditRequests: Array.isArray(parsed.creditRequests) ? parsed.creditRequests : [],
      callLogs: Array.isArray(parsed.callLogs) ? parsed.callLogs : [],
    };
  } catch {
    return {
      contacts: [],
      conversations: [],
      tickets: [],
      timelineEvents: [],
      deals: [],
      creditAccounts: [],
      creditRequests: [],
      callLogs: [],
    };
  }
};

export const loadTemplateSeedContacts = (templateId, templatesDir) =>
  loadTemplateSeedBundle(templateId, templatesDir).contacts;

export const buildSeedCustomerRecord = (c) => {
  const cleanPhone = String(c.phone || '081-000-0000');
  const words = String(c.name || c.id).trim().split(/\s+/);
  const initials =
    words.length >= 2 ? `${words[0][0] || ''}${words[1][0] || ''}` : String(c.name || 'PT').slice(0, 2);

  return {
    id: String(c.id),
    name: String(c.name || c.id),
    nickname: c.nickname || '',
    customerType: c.customerType || 'INDIVIDUAL',
    contacts: [],
    addresses: [],
    initials,
    tier: c.tier || 'MEMBER',
    creditGrade: c.creditGrade || 'A',
    segments: Array.isArray(c.segments) ? c.segments : ['ทั่วไป'],
    lifetimeValue: Number(c.lifetimeValue) || 0,
    spend12Months: Number(c.spend12Months) || 0,
    orders12Months: Number(c.orders12Months) || 0,
    lastOrderDaysAgo: Number(c.lastOrderDaysAgo) || 0,
    lastOrderCode: c.lastOrderCode || '-',
    lastOrderAmount: Number(c.lastOrderAmount) || 0,
    tierValidUntil: '31 ธ.ค. 2026',
    tierProgressPercent: 100,
    tierTargetSpend: 0,
    phone: cleanPhone,
    fullPhone: cleanPhone.replace(/[^0-9+]/g, '') || cleanPhone,
    email: c.email || '-',
    channels: { line: true, facebook: true },
    birthday: c.birthday || '-',
    customerSince: c.customerSince || '2026',
    consent: {
      marketingLine: true,
      marketingEmail: false,
      marketingSms: false,
      sensitiveMedical: true,
      consentSource: 'LINE LIFF',
    },
    creditLimit: Number(c.creditLimit) || 0,
    creditUsed: Number(c.creditUsed) || 0,
    creditOverdue: Number(c.creditOverdue) || 0,
    churnRisk: c.churnRisk || 'ต่ำ',
    nextBestAction: c.nextBestAction || {
      description: 'ติดตามการให้บริการต่อเนื่อง',
      actionLabel: 'ติดต่อกลับ',
    },
  };
};

export const applyTemplateSeedContacts = async ({
  tenantId,
  templateId,
  customFields,
  customerRepo,
  convStore,
  caseRepo,
  templatesDir,
}) => {
  const bundle = loadTemplateSeedBundle(templateId, templatesDir);

  for (const c of bundle.contacts) {
    if (!c?.id) continue;
    const cid = String(c.id);
    if (customerRepo) {
      const existingCust = await customerRepo.findById(cid, tenantId);
      if (!existingCust) {
        await customerRepo.upsert(buildSeedCustomerRecord(c), tenantId);
      }
    }
    if (customFields && c.customFields) {
      const existingCf = await customFields.getEntityFields(tenantId, 'contact', cid);
      if (!existingCf || Object.keys(existingCf).length === 0) {
        await customFields.validateAndSaveEntityFields({
          tenantId,
          entityType: 'contact',
          entityId: cid,
          values: c.customFields,
        });
      }
    }
  }

  if (convStore) {
    for (const conv of bundle.conversations) {
      if (conv?.id) {
        await convStore.seedConversation(tenantId, conv);
      }
    }
  }

  if (caseRepo) {
    for (const ticket of bundle.tickets) {
      if (!ticket?.id) continue;
      const existingCase = await caseRepo.findById(String(ticket.id), tenantId);
      if (!existingCase) {
        await caseRepo.upsert(
          {
            customerTier: 'MEMBER',
            slaHoursLeft: 4,
            slaStatus: 'normal',
            priority: 'Normal',
            ...ticket,
            id: String(ticket.id),
          },
          tenantId
        );
      }
    }
  }
};
