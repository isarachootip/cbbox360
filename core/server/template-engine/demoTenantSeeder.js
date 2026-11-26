/**
 * demoTenantSeeder.js — Idempotently provisions showcase Multi-Tenant workspaces
 * (such as the unified SINGER & SG Capital `singer-sgc` tenant) when running in multi_tenant mode.
 */
import { templateEngine as defaultEngine } from './templateApplier.js';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';

export const DEFAULT_DEMO_TENANTS = [
  {
    slug: 'singer-sgc',
    name: 'SINGER & SG Capital (SG Finance+)',
    templateName: 'consumer_finance',
    domain: 'singer-sgc.cbox360.online',
  },
];

export const ensureDefaultDemoTenants = async ({
  engine = defaultEngine,
  tenantRepo = defaultTenantRepo,
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
  demoTenants = DEFAULT_DEMO_TENANTS,
} = {}) => {
  if (deploymentMode === 'single_tenant') {
    return [];
  }

  const created = [];
  for (const spec of demoTenants) {
    const existing = await tenantRepo.findBySlug(spec.slug);
    if (existing) continue;
    const provisioned = await engine.createTenantFromTemplate(spec);
    created.push({
      id: provisioned.tenant.id,
      slug: provisioned.tenant.slug,
      templateId: provisioned.template.id,
    });
  }
  return created;
};
