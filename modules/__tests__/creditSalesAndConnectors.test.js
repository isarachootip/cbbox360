import { describe, it, expect } from 'vitest';
import express from 'express';
import { createServerModuleRegistry } from '../../core/server/registry/serverModuleRegistry.js';
import { createInMemoryEntitlementService } from '../../core/server/entitlements/entitlementService.js';
import { runWithTenantContext } from '../../core/server/tenancy/tenantContext.js';
import { creditSalesServerManifest } from '../credit-sales/manifest.js';
import { listEntitledConnectors, getConnectorById } from '../../connectors/registry.js';

describe('Extracted Modules & Connectors Integration (Phase 3)', () => {
  it('allows credit-sales API on entitled tenant and blocks Hospital/Insurance tenants with 403', async () => {
    const entitlements = createInMemoryEntitlementService();
    await entitlements.setEntitlement('tnt_hosp', 'module:credit-sales', false);

    const registry = createServerModuleRegistry({
      entitlements,
      requireAuth: (_req, _res, next) => next(),
    });
    registry.register(creditSalesServerManifest);

    const app = express();
    app.use('/api', (req, _res, next) => {
      const tid = String(req.headers['x-test-tenant'] || 'default');
      runWithTenantContext({ tenantId: tid }, () => next());
    });
    app.use('/api', registry.buildApiRouter());

    const server = app.listen(0);
    const port = server.address().port;

    try {
      // 'default' tenant has module:credit-sales enabled via module bootstrap
      const createRes = await fetch(`http://127.0.0.1:${port}/api/m/credit-sales/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-tenant': 'default' },
        body: JSON.stringify({ contactId: 'C00123', creditLimit: 300000, creditUsed: 120000 }),
      });
      expect(createRes.status).toBe(201);

      // 'tnt_hosp' tenant is NOT entitled to module:credit-sales -> 403
      const hospRes = await fetch(`http://127.0.0.1:${port}/api/m/credit-sales/accounts`, {
        headers: { 'x-test-tenant': 'tnt_hosp' },
      });
      expect(hospRes.status).toBe(403);
      const hospJson = await hospRes.json();
      expect(hospJson.error).toBe('FEATURE_NOT_ENTITLED');
    } finally {
      server.close();
    }
  });

  it('filters HIS and Insurance Core connectors strictly by tenant entitlement and runs sandbox lookups', async () => {
    const entitlements = createInMemoryEntitlementService();
    await entitlements.setEntitlement('tnt_hosp', 'connector:his-fhir', true);
    await entitlements.setEntitlement('tnt_ins', 'connector:insurance-core', true);

    const hospConns = await listEntitledConnectors('tnt_hosp', entitlements.isEnabled);
    expect(hospConns.map((c) => c.id)).toEqual(['his-fhir']);

    const insConns = await listEntitledConnectors('tnt_ins', entitlements.isEnabled);
    expect(insConns.map((c) => c.id)).toEqual(['insurance-core']);

    const his = getConnectorById('his-fhir');
    expect((await his.testConnection()).ok).toBe(true);
    const patient = await his.lookupPatientByHn('HN-6904812');
    expect(patient?.preferredDepartment).toBe('ศูนย์อายุรกรรมหัวใจ');

    const insCore = getConnectorById('insurance-core');
    expect((await insCore.testConnection()).ok).toBe(true);
    const policy = await insCore.verifyPolicyEligibility('POL-2026-8801');
    expect(policy?.status).toBe('ACTIVE');
  });
});
