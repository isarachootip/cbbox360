import { describe, it, expect } from 'vitest';
import path from 'path';
import express from 'express';
import { parse as parseYaml } from 'yaml';
import { loadBuiltInTemplate, validateTemplateObject } from '../templateValidator.js';
import { createTemplateEngine } from '../templateApplier.js';
import { exportTenantTemplateYaml } from '../templateExporter.js';
import { createInMemoryTenantRepository } from '../../tenancy/tenantRepository.js';
import { createInMemoryEntitlementService } from '../../entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../../rbac/permissionService.js';
import { createInMemoryLabelService } from '../../labels/labelService.js';
import { createInMemoryCustomFieldService } from '../../custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../../cases/caseConfigService.js';
import { createServerModuleRegistry } from '../../registry/serverModuleRegistry.js';
import { createDomainEventBus } from '../../registry/domainEventBus.js';
import { runWithTenantContext } from '../../tenancy/tenantContext.js';
import { appointmentServerManifest } from '../../../../modules/appointment/manifest.js';
import { policyServerManifest } from '../../../../modules/policy/manifest.js';
import { claimServerManifest } from '../../../../modules/claim/manifest.js';
import { orderTrackingServerManifest } from '../../../../modules/order-tracking/manifest.js';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');

const buildTestPlatform = () => {
  const tenantRepo = createInMemoryTenantRepository();
  const entitlements = createInMemoryEntitlementService();
  const permissions = createInMemoryPermissionService();
  const labels = createInMemoryLabelService();
  const customFields = createInMemoryCustomFieldService();
  const caseConfigs = createInMemoryCaseConfigService();
  const events = createDomainEventBus();

  const engine = createTemplateEngine({
    templatesDir: TEMPLATES_DIR,
    tenantRepo,
    entitlements,
    permissions,
    labels,
    customFields,
    caseConfigs,
  });

  const registry = createServerModuleRegistry({
    entitlements,
    labels,
    events,
    requireAuth: (_req, _res, next) => next(),
  });
  registry.register(appointmentServerManifest);
  registry.register(policyServerManifest);
  registry.register(claimServerManifest);
  registry.register(orderTrackingServerManifest);
  registry.bindAllEventHandlers();

  return {
    tenantRepo,
    entitlements,
    permissions,
    labels,
    customFields,
    caseConfigs,
    events,
    engine,
    registry,
  };
};

describe('Phase 4 Template Engine, Hospital/Insurance/Ecommerce Templates & Modules', () => {
  it('validates hospital, insurance, b2b_wholesale, and ecommerce template.yaml files cleanly', () => {
    for (const name of ['hospital', 'insurance', 'b2b_wholesale', 'ecommerce']) {
      const tpl = loadBuiltInTemplate(name, TEMPLATES_DIR);
      const check = validateTemplateObject(tpl);
      expect(check).toEqual({ valid: true, errors: [] });
    }

    // Broken reference (category pointing to missing slaPolicySlug) must fail validation
    const broken = loadBuiltInTemplate('hospital', TEMPLATES_DIR);
    broken.caseCategories[0].slaPolicySlug = 'non_existent_sla';
    const badCheck = validateTemplateObject(broken);
    expect(badCheck.valid).toBe(false);
    expect(badCheck.errors.join(' ')).toContain('non_existent_sla');
  });

  it('provisions a Hospital tenant and an Insurance tenant from YAML with isolated modules, fields, labels & categories', async () => {
    const { engine, labels, customFields, caseConfigs, registry } = buildTestPlatform();

    const hosp = await engine.createTenantFromTemplate({
      slug: 'rama-hosp',
      name: 'โรงพยาบาลรามาเมดิคอล',
      templateName: 'hospital',
      domain: 'rama.cb360.online',
    });

    const ins = await engine.createTenantFromTemplate({
      slug: 'thai-insure',
      name: 'ไทยประกันคุ้มครอง',
      templateName: 'insurance',
      domain: 'insure.cb360.online',
    });

    // Terminology labels differ at runtime
    expect(await labels.t(hosp.tenant.id, 'contact.singular', 'ลูกค้า')).toBe('ผู้ป่วย');
    expect(await labels.t(ins.tenant.id, 'contact.singular', 'ลูกค้า')).toBe('ผู้เอาประกัน');

    // Required Hospital fields: hn, drug_allergies, treatment_right, preferred_department, preferred_doctor
    const hospFields = (await customFields.listFieldDefs(hosp.tenant.id, 'contact')).map((f) => f.key);
    expect(hospFields).toEqual(
      expect.arrayContaining([
        'hn',
        'drug_allergies',
        'treatment_right',
        'preferred_department',
        'preferred_doctor',
      ])
    );

    // Required Hospital categories: นัดหมาย, สอบถามผลตรวจ, ร้องเรียน, การเงิน
    const hospCats = (await caseConfigs.listCategories(hosp.tenant.id)).map((c) => c.name);
    expect(hospCats).toEqual(['นัดหมาย', 'สอบถามผลตรวจ', 'ร้องเรียน', 'การเงิน']);

    // Required Insurance fields: policy_number, policy_type, policy_expiry_date, assigned_agent
    const insFields = (await customFields.listFieldDefs(ins.tenant.id, 'contact')).map((f) => f.key);
    expect(insFields).toEqual(
      expect.arrayContaining([
        'policy_number',
        'policy_type',
        'policy_expiry_date',
        'assigned_agent',
      ])
    );

    // Required Insurance categories: เคลม, ต่ออายุ, แก้ไขข้อมูล, ร้องเรียน
    const insCats = (await caseConfigs.listCategories(ins.tenant.id)).map((c) => c.name);
    expect(insCats).toEqual(['เคลม', 'ต่ออายุ', 'แก้ไขข้อมูล', 'ร้องเรียน']);

    // Module API isolation: Hospital can call /m/appointment, blocked from /m/claim; Insurance vice-versa!
    const app = express();
    app.use(express.json());
    app.use('/api', (req, _res, next) => {
      runWithTenantContext({ tenantId: String(req.headers['x-tenant-id']) }, () => next());
    });
    app.use('/api', registry.buildApiRouter());

    const server = app.listen(0);
    const port = server.address().port;

    try {
      const bookRes = await fetch(`http://127.0.0.1:${port}/api/m/appointment/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': hosp.tenant.id },
        body: JSON.stringify({
          contactId: 'P001',
          hn: 'HN-69001',
          department: 'อายุรกรรม',
          doctorName: 'นพ. กิตติพงศ์',
          scheduledAt: '2026-12-01T09:30:00Z',
        }),
      });
      expect(bookRes.status).toBe(201);

      const hospBlockedClaim = await fetch(`http://127.0.0.1:${port}/api/m/claim/claims`, {
        headers: { 'x-tenant-id': hosp.tenant.id },
      });
      expect(hospBlockedClaim.status).toBe(403);

      const insPolicyRes = await fetch(`http://127.0.0.1:${port}/api/m/policy/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': ins.tenant.id },
        body: JSON.stringify({
          contactId: 'I001',
          policyNumber: 'POL-9988',
          policyType: 'HEALTH',
          expiryDate: '2027-06-30',
          agentName: 'คุณวรัญญา',
          sumInsured: 1000000,
        }),
      });
      expect(insPolicyRes.status).toBe(201);

      const insClaimRes = await fetch(`http://127.0.0.1:${port}/api/m/claim/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': ins.tenant.id },
        body: JSON.stringify({
          contactId: 'I001',
          policyNumber: 'POL-9988',
          incidentDate: '2026-11-18',
          claimAmount: 18500,
        }),
      });
      expect(insClaimRes.status).toBe(201);

      const insBlockedAppoint = await fetch(`http://127.0.0.1:${port}/api/m/appointment/appointments`, {
        headers: { 'x-tenant-id': ins.tenant.id },
      });
      expect(insBlockedAppoint.status).toBe(403);
    } finally {
      server.close();
    }
  });

  it('preserves tenant-customized config on template upgrade and exports valid YAML', async () => {
    const platform = buildTestPlatform();
    const { tenant } = await platform.engine.createTenantFromTemplate({
      slug: 'custom-hosp',
      name: 'รพ. ปรับแต่งเอง',
      templateName: 'hospital',
    });

    // Tenant customizes label and adds a custom field of its own
    await platform.labels.setTenantLabel(tenant.id, 'th', 'contact.singular', 'คนไข้ VIP');
    await platform.customFields.upsertFieldDef(
      tenant.id,
      { entityType: 'contact', key: 'vip_lounge_code', label: 'รหัสห้องรับรอง', type: 'text' },
      { origin: 'tenant', isCustomized: true }
    );

    // Upgrade template -> must NOT overwrite 'คนไข้ VIP' or remove 'vip_lounge_code'
    const upgradedTpl = loadBuiltInTemplate('hospital', TEMPLATES_DIR);
    upgradedTpl.metadata.version = '1.1.0';
    upgradedTpl.labels.th['case.plural'] = 'รายการเคสผู้ป่วยทั้งหมด';

    await platform.engine.importTemplateIntoTenant(tenant.id, upgradedTpl);

    expect(await platform.labels.t(tenant.id, 'contact.singular', 'ลูกค้า')).toBe('คนไข้ VIP');
    expect(await platform.labels.t(tenant.id, 'case.plural', 'เคส')).toBe('รายการเคสผู้ป่วยทั้งหมด');
    const fieldKeys = (await platform.customFields.listFieldDefs(tenant.id, 'contact')).map((f) => f.key);
    expect(fieldKeys).toContain('vip_lounge_code');

    // Export tenant configuration to YAML -> must parse & pass template validator!
    const yamlStr = await exportTenantTemplateYaml({
      tenantId: tenant.id,
      tenantRepo: platform.tenantRepo,
      entitlements: platform.entitlements,
      permissions: platform.permissions,
      labels: platform.labels,
      customFields: platform.customFields,
      caseConfigs: platform.caseConfigs,
    });
    const reParsed = parseYaml(yamlStr);
    expect(validateTemplateObject(reParsed)).toEqual({ valid: true, errors: [] });
    expect(reParsed.labels.th['contact.singular']).toBe('คนไข้ VIP');
  });
});
