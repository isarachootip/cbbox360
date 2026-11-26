import { describe, it, expect } from 'vitest';
import path from 'path';
import { loadBuiltInTemplate, validateTemplateObject } from '../templateValidator.js';
import {
  buildSeedCustomerRecord,
  loadTemplateSeedBundle,
} from '../templateSeedLoader.js';
import { createTemplateEngine } from '../templateApplier.js';
import { ensureDefaultDemoTenants } from '../demoTenantSeeder.js';
import { createInMemoryTenantRepository } from '../../tenancy/tenantRepository.js';
import { createInMemoryEntitlementService } from '../../entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../../rbac/permissionService.js';
import { createInMemoryLabelService } from '../../labels/labelService.js';
import { createInMemoryCustomFieldService } from '../../custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../../cases/caseConfigService.js';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');

const buildMemoryEngine = () => {
  const tenantRepo = createInMemoryTenantRepository();
  const entitlements = createInMemoryEntitlementService();
  const permissions = createInMemoryPermissionService();
  const labels = createInMemoryLabelService();
  const customFields = createInMemoryCustomFieldService();
  const caseConfigs = createInMemoryCaseConfigService();
  const customers = new Map();

  const customerRepo = {
    async findById(id, tenantId) {
      return customers.get(`${tenantId}::${id}`) ?? null;
    },
    async upsert(record, tenantId) {
      customers.set(`${tenantId}::${record.id}`, record);
      return record;
    },
  };

  const engine = createTemplateEngine({
    templatesDir: TEMPLATES_DIR,
    tenantRepo,
    entitlements,
    permissions,
    labels,
    customFields,
    caseConfigs,
    customerRepo,
    convStore: null,
    caseRepo: null,
  });

  return { tenantRepo, entitlements, labels, customFields, caseConfigs, customers, engine };
};

describe('consumer_finance template & singer-sgc demo tenant provisioning', () => {
  it('validates consumer_finance/template.yaml cleanly with hire-purchase & SG Finance+ fields', () => {
    const tpl = loadBuiltInTemplate('consumer_finance', TEMPLATES_DIR);
    expect(validateTemplateObject(tpl)).toEqual({ valid: true, errors: [] });
    expect(tpl.entitlements.modules).toContain('credit-sales');

    const fieldKeys = (tpl.customFields?.contact || []).map((f) => f.key);
    expect(fieldKeys).toEqual(
      expect.arrayContaining([
        'contract_no',
        'loan_product',
        'device_or_asset',
        'monthly_installment',
        'dpd_status',
        'ptp_date',
      ])
    );
  });

  it('loads rich seed bundle (creditAccounts, creditRequests, callLogs) and preserves customer credit metrics', () => {
    const bundle = loadTemplateSeedBundle('consumer_finance', TEMPLATES_DIR);
    expect(bundle.contacts.length).toBeGreaterThanOrEqual(4);
    expect(bundle.conversations.length).toBeGreaterThanOrEqual(3);
    expect(bundle.tickets.length).toBeGreaterThanOrEqual(3);
    expect(bundle.deals.length).toBeGreaterThanOrEqual(3);
    expect(bundle.creditAccounts.length).toBeGreaterThanOrEqual(4);
    expect(bundle.creditRequests.length).toBeGreaterThanOrEqual(2);
    expect(bundle.callLogs.length).toBeGreaterThanOrEqual(3);

    const overdueContact = bundle.contacts.find((c) => Number(c.creditOverdue) > 0);
    expect(overdueContact).toBeDefined();
    const hydrated = buildSeedCustomerRecord(overdueContact);
    expect(hydrated.creditLimit).toBeGreaterThan(0);
    expect(hydrated.creditOverdue).toBeGreaterThan(0);
    expect(['B', 'C', 'D']).toContain(hydrated.creditGrade);
  });

  it('idempotently provisions singer-sgc unified demo tenant on boot without duplicating', async () => {
    const { tenantRepo, labels, customFields, customers, engine } = buildMemoryEngine();

    const firstRun = await ensureDefaultDemoTenants({ engine, tenantRepo, deploymentMode: 'multi_tenant' });
    expect(firstRun.some((r) => r.slug === 'singer-sgc')).toBe(true);

    const tenant = await tenantRepo.findBySlug('singer-sgc');
    expect(tenant).toBeTruthy();
    expect(tenant.templateId).toBe('consumer_finance');
    expect(await labels.t(tenant.id, 'contact.singular', 'ลูกค้า')).toBe('ลูกค้าสินเชื่อ');

    const cfFirst = await customFields.getEntityFields(tenant.id, 'contact', 'SGC001');
    expect(cfFirst.loan_product).toBe('SG_FINANCE_PHONE');
    expect(customers.get(`${tenant.id}::SGC001`)).toBeTruthy();

    // Second run must be a clean no-op
    const secondRun = await ensureDefaultDemoTenants({ engine, tenantRepo, deploymentMode: 'multi_tenant' });
    expect(secondRun).toEqual([]);
  });
});
