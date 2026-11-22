#!/usr/bin/env node
/**
 * scripts/smoke-template.js — End-to-End Template Provisioning & Primary Flow Smoke Runner.
 * CLI usage: node scripts/smoke-template.js <hospital|insurance|b2b_wholesale|ecommerce>
 */
import path from 'path';
import express from 'express';
import { DEFAULT_SMOKE_SCENARIOS } from './smokeScenarios.js';
import { createInMemoryTenantRepository } from '../core/server/tenancy/tenantRepository.js';
import { createInMemoryConnectorVault } from '../core/server/tenancy/connectorVaultRepository.js';
import { createTenantResolverMiddleware } from '../core/server/tenancy/tenantResolverMiddleware.js';
import { createInMemoryEntitlementService } from '../core/server/entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../core/server/rbac/permissionService.js';
import { createInMemoryLabelService } from '../core/server/labels/labelService.js';
import { createInMemoryCustomFieldService } from '../core/server/custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../core/server/cases/caseConfigService.js';
import { createInMemoryCaseRepository } from '../server/repositories/caseRepository.js';
import { createCaseController } from '../server/controllers/caseController.js';
import { createTemplateEngine } from '../core/server/template-engine/templateApplier.js';
import { createTenantBootstrapRouter } from '../core/server/tenancy/tenantBootstrapRoutes.js';
import { createCustomFieldRouter } from '../core/server/custom-fields/customFieldRoutes.js';
import { createServerModuleRegistry } from '../core/server/registry/serverModuleRegistry.js';
import { creditSalesServerManifest } from '../modules/credit-sales/manifest.js';
import { appointmentServerManifest } from '../modules/appointment/manifest.js';
import { policyServerManifest } from '../modules/policy/manifest.js';
import { claimServerManifest } from '../modules/claim/manifest.js';
import { orderTrackingServerManifest } from '../modules/order-tracking/manifest.js';

export const runTemplateSmokeFlow = async (templateName, customScenario) => {
  const scenario = customScenario || DEFAULT_SMOKE_SCENARIOS[templateName];
  if (!scenario) throw new Error(`No smoke scenario configured for template: ${templateName}`);

  const tenantRepo = createInMemoryTenantRepository();
  const connectorVault = createInMemoryConnectorVault();
  const entitlements = createInMemoryEntitlementService();
  const permissions = createInMemoryPermissionService();
  const labels = createInMemoryLabelService();
  const customFields = createInMemoryCustomFieldService();
  const caseConfigs = createInMemoryCaseConfigService();
  const caseRepo = createInMemoryCaseRepository();

  const engine = createTemplateEngine({
    tenantRepo,
    entitlements,
    permissions,
    labels,
    customFields,
    caseConfigs,
    caseRepo,
  });

  const slug = `smoke-${templateName.replace(/_/g, '-')}`;
  const domain = `${slug}.cb360.online`;
  const { tenant } = await engine.createTenantFromTemplate({
    slug,
    name: `Smoke ${templateName}`,
    templateName,
    domain,
  });

  const mockAuth = (req, _res, next) => {
    req.user = { id: 'usr-admin', username: 'admin', role: 'admin' };
    next();
  };

  const registry = createServerModuleRegistry({ entitlements, labels, requireAuth: mockAuth });
  [
    creditSalesServerManifest,
    appointmentServerManifest,
    policyServerManifest,
    claimServerManifest,
    orderTrackingServerManifest,
  ].forEach((m) => registry.register(m));

  const app = express();
  app.use(express.json());
  app.use('/api', createTenantResolverMiddleware({ tenantRepo, connectorVault }));
  app.use(
    '/api',
    createTenantBootstrapRouter({
      requireAuth: mockAuth,
      tenantRepo,
      entitlements,
      permissions,
      labels,
      customFields,
      caseConfigs,
    })
  );
  app.use(
    '/api',
    createCustomFieldRouter({
      requireAuth: mockAuth,
      cfService: customFields,
      permService: permissions,
      audit: async () => {},
    })
  );
  app.use('/api', registry.buildApiRouter());
  const caseCtrl = createCaseController({ caseRepo });
  app.get('/api/cases', mockAuth, (req, res) => caseCtrl.listCases(req, res));
  app.post('/api/cases', mockAuth, (req, res) => caseCtrl.createCase(req, res));

  const server = app.listen(0);
  const port = server.address().port;
  const headers = { 'Content-Type': 'application/json', 'X-Forwarded-Host': domain };

  try {
    const brandRes = await fetch(`http://127.0.0.1:${port}/api/public/branding`, { headers });
    const bootRes = await fetch(`http://127.0.0.1:${port}/api/tenant/bootstrap`, { headers });
    const bootJson = await bootRes.json();

    const cfRes = await fetch(`http://127.0.0.1:${port}/api/contacts/SMOKE-1/custom-fields`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values: scenario.sampleFields }),
    });
    if (cfRes.status !== 200) {
      throw new Error(`Custom field save failed (${cfRes.status}): ${await cfRes.text()}`);
    }

    const entRes = await fetch(`http://127.0.0.1:${port}${scenario.entitledPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(scenario.entitledPayload),
    });
    const blkRes = await fetch(`http://127.0.0.1:${port}${scenario.blockedPath}`, { headers });

    return {
      ok: brandRes.status === 200 && bootRes.status === 200 && entRes.status === 201 && blkRes.status === 403,
      tenantId: tenant.id,
      template: templateName,
      contactLabel: bootJson.labels?.['contact.singular'] || 'ลูกค้า',
      categoriesCount: bootJson.caseCategories?.length || 0,
      entitledStatus: entRes.status,
      blockedStatus: blkRes.status,
    };
  } finally {
    server.close();
  }
};

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(process.cwd(), 'scripts/smoke-template.js');

if (isMain) {
  const tpl = process.argv[2] || 'hospital';
  runTemplateSmokeFlow(tpl)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      if (!res.ok) process.exit(1);
    })
    .catch((err) => {
      console.error(`❌ [Smoke Failed for ${tpl}]:`, err.message);
      process.exit(1);
    });
}
