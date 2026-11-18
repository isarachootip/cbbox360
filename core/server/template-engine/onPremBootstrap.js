/**
 * onPremBootstrap.js — Idempotent On-Premises & Single-Tenant Contract Preloader.
 * Allows shipping the exact same Docker image to any on-prem customer and pre-loading
 * their contracted template + licensed entitlements purely via environment variables / Helm values.
 */
import { templateEngine as defaultEngine } from './templateApplier.js';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';
import { entitlementService as defaultEntitlements } from '../entitlements/entitlementService.js';

const parseCsv = (raw) =>
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const bootstrapOnPremContract = async ({
  envConfig = {
    preloadTemplate: process.env.CB360_PRELOAD_TEMPLATE || '',
    tenantSlug: process.env.CB360_PRELOAD_SLUG || 'default',
    tenantName: process.env.CB360_PRELOAD_NAME || '',
    domain: process.env.CB360_PRELOAD_DOMAIN || '',
    licensedEntitlements: process.env.CB360_LICENSED_ENTITLEMENTS || '',
    disabledEntitlements: process.env.CB360_DISABLED_ENTITLEMENTS || '',
  },
  engine = defaultEngine,
  tenantRepo = defaultTenantRepo,
  entitlements = defaultEntitlements,
} = {}) => {
  const templateName = String(envConfig.preloadTemplate || '').trim();
  if (!templateName) {
    return { provisioned: false, tenantId: null };
  }

  const slug = String(envConfig.tenantSlug || 'default').trim().toLowerCase();
  let tenant = await tenantRepo.findBySlug(slug);

  if (!tenant) {
    const created = await engine.createTenantFromTemplate({
      slug,
      name: envConfig.tenantName || slug,
      templateName,
      domain: envConfig.domain || undefined,
    });
    tenant = created.tenant;
  } else {
    if (envConfig.tenantName) {
      tenant = await tenantRepo.upsertTenant({ ...tenant, name: envConfig.tenantName });
    }
    if (envConfig.domain) {
      await tenantRepo.bindDomain(envConfig.domain, tenant.id, true);
    }
    await engine.importTemplateIntoTenant(tenant.id, templateName);
  }

  for (const key of parseCsv(envConfig.licensedEntitlements)) {
    await entitlements.setEntitlement(tenant.id, key, true, {
      origin: 'license',
      isCustomized: true,
    });
  }

  for (const key of parseCsv(envConfig.disabledEntitlements)) {
    await entitlements.setEntitlement(tenant.id, key, false, {
      origin: 'license',
      isCustomized: true,
    });
  }

  return { provisioned: true, tenantId: tenant.id, slug: tenant.slug, template: templateName };
};
