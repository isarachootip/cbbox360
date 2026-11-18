import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { createDomainEventBus } from '../domainEventBus.js';
import { createServerModuleRegistry } from '../serverModuleRegistry.js';
import { createInMemoryEntitlementService } from '../../entitlements/entitlementService.js';
import { runWithTenantContext } from '../../tenancy/tenantContext.js';

describe('Server Module Registry & Domain Event Bus (Phase 2 - PR-05)', () => {
  it('gates module routes, event handlers, and variable resolvers strictly by tenant entitlement', async () => {
    const entitlements = createInMemoryEntitlementService();
    const events = createDomainEventBus();
    const eventHandledForTenants = [];

    await entitlements.setEntitlement('tnt_hosp', 'module:mock-appoint', true, {
      origin: 'template',
      isCustomized: false,
    });

    const registry = createServerModuleRegistry({
      entitlements,
      events,
      requireAuth: (_req, _res, next) => next(),
    });

    registry.register({
      id: 'mock-appoint',
      version: '1.0.0',
      requiredEntitlement: 'module:mock-appoint',
      permissions: [{ code: 'mock-appoint:read', name: 'Read Mock Appointments' }],
      registerRoutes(router) {
        router.get('/slots', (_req, res) => {
          res.status(200).json({ ok: true, slots: ['09:00', '10:30'] });
        });
      },
      registerEventHandlers(bus) {
        bus.subscribe('case.created', async (evt) => {
          eventHandledForTenants.push(evt.tenantId);
        });
      },
      async resolveTemplateVariables({ contactId }) {
        return { next_slot: `SLOT-${contactId}` };
      },
    });

    // Reject duplicate registration
    expect(() =>
      registry.register({
        id: 'mock-appoint',
        version: '1.0.0',
        requiredEntitlement: 'module:mock-appoint',
        permissions: [],
      })
    ).toThrow(/DUPLICATE_MODULE_ID/);

    // Test Express route gating via lightweight HTTP invoke
    const app = express();
    app.use('/api', (req, _res, next) => {
      const tid = String(req.headers['x-test-tenant'] || 'default');
      runWithTenantContext({ tenantId: tid }, () => next());
    });
    app.use('/api', registry.buildApiRouter());

    const server = app.listen(0);
    const port = server.address().port;

    try {
      // Blocked for 'default' tenant (not entitled)
      const blockedRes = await fetch(`http://127.0.0.1:${port}/api/m/mock-appoint/slots`, {
        headers: { 'x-test-tenant': 'default' },
      });
      expect(blockedRes.status).toBe(403);
      const blockedJson = await blockedRes.json();
      expect(blockedJson.error).toBe('FEATURE_NOT_ENTITLED');

      // Allowed for 'tnt_hosp' tenant (entitled)
      const okRes = await fetch(`http://127.0.0.1:${port}/api/m/mock-appoint/slots`, {
        headers: { 'x-test-tenant': 'tnt_hosp' },
      });
      expect(okRes.status).toBe(200);
      const okJson = await okRes.json();
      expect(okJson.slots).toEqual(['09:00', '10:30']);
    } finally {
      server.close();
    }

    // Event bus only invokes handler for entitled tenant!
    registry.bindAllEventHandlers();
    await events.publish({
      name: 'case.created',
      tenantId: 'default',
      occurredAt: new Date().toISOString(),
      payload: { caseId: 'TK-1' },
    });
    await events.publish({
      name: 'case.created',
      tenantId: 'tnt_hosp',
      occurredAt: new Date().toISOString(),
      payload: { caseId: 'TK-2' },
    });
    expect(eventHandledForTenants).toEqual(['tnt_hosp']);

    // Variable resolver only resolves for entitled tenant!
    expect(await registry.resolveVariables({ tenantId: 'default', contactId: 'C1' })).toEqual({});
    expect(await registry.resolveVariables({ tenantId: 'tnt_hosp', contactId: 'C1' })).toEqual({
      next_slot: 'SLOT-C1',
    });
    expect(registry.collectPermissions()).toEqual([
      { code: 'mock-appoint:read', name: 'Read Mock Appointments', moduleId: 'mock-appoint' },
    ]);
  });
});
