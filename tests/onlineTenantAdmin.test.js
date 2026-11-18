import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { createInMemoryTenantRepository, createPgTenantRepository } from '../core/server/tenancy/tenantRepository.js';
import { createTenantResolverMiddleware } from '../core/server/tenancy/tenantResolverMiddleware.js';
import { createTemplateEngine } from '../core/server/template-engine/templateApplier.js';
import { createTemplateAdminRouter } from '../core/server/template-engine/templateAdminRoutes.js';
import { createInMemoryEntitlementService, createPgEntitlementService } from '../core/server/entitlements/entitlementService.js';
import { createInMemoryPermissionService, createPgPermissionService } from '../core/server/rbac/permissionService.js';
import { createInMemoryLabelService, createPgLabelService } from '../core/server/labels/labelService.js';
import { createInMemoryCustomFieldService, createPgCustomFieldService } from '../core/server/custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService, createPgCaseConfigService } from '../core/server/cases/caseConfigService.js';

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });

describe('Online Tenant Provisioning, *.cbox360.online Subdomain & PG Persistence', () => {
  it('resolves *.cbox360.online automatically and manages tenants via /api/admin/tenants', async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const entitlements = createInMemoryEntitlementService();
    const permissions = createInMemoryPermissionService();
    const labels = createInMemoryLabelService();
    const customFields = createInMemoryCustomFieldService();
    const caseConfigs = createInMemoryCaseConfigService();

    const engine = createTemplateEngine({
      tenantRepo,
      entitlements,
      permissions,
      labels,
      customFields,
      caseConfigs,
    });

    const app = express();
    app.use(express.json());
    app.use('/api', createTenantResolverMiddleware({ tenantRepo }));

    const requireAuth = (req, _res, next) => {
      req.user = { id: 'u1', username: 'sysadmin', role: 'sysadmin' };
      next();
    };
    const requireRole = (...roles) => (req, res, next) =>
      roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'FORBIDDEN' });

    app.use('/api', createTemplateAdminRouter({ requireAuth, requireRole, engine, tenantRepo }));
    app.get('/api/whoami-tenant', (req, res) => {
      res.json({ slug: req.tenant.slug, name: req.tenant.name, templateId: req.tenant.templateId });
    });

    const srv = await startServer(app);
    try {
      // 1. Create 'hospital' tenant WITHOUT explicit domain first to prove *.cbox360.online subdomain resolution
      const createRes = await fetch(`${srv.url}/api/admin/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'hospital',
          name: 'โรงพยาบาลซีบ็อกซ์',
          template: 'hospital',
        }),
      });
      expect(createRes.status).toBe(201);

      // 2. Hit with X-Forwarded-Host: hospital.cbox360.online -> resolves automatically!
      const subRes = await fetch(`${srv.url}/api/whoami-tenant`, {
        headers: { 'X-Forwarded-Host': 'hospital.cbox360.online' },
      });
      const subData = await subRes.json();
      expect(subData.slug).toBe('hospital');
      expect(subData.templateId).toBe('hospital');

      // 3. Bind custom domain + update name via PATCH /api/admin/tenants/hospital
      const patchRes = await fetch(`${srv.url}/api/admin/tenants/hospital`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'รพ.ซีบ็อกซ์ ออนไลน์',
          domain: 'hospital.cbox360.online',
          status: 'active',
        }),
      });
      expect(patchRes.status).toBe(200);

      // 4. List all tenants via GET /api/admin/tenants (includes domains & branding)
      const listRes = await fetch(`${srv.url}/api/admin/tenants`);
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.success).toBe(true);
      const hosp = listBody.tenants.find((t) => t.slug === 'hospital');
      expect(hosp).toBeDefined();
      expect(hosp.name).toBe('รพ.ซีบ็อกซ์ ออนไลน์');
      expect(hosp.domains).toContain('hospital.cbox360.online');
      expect(hosp.branding.primaryColor).toBe('#059669');
    } finally {
      await srv.close();
    }
  });

  it('writes tenant, settings, entitlements, labels, roles, fields, and cases to PostgreSQL', async () => {
    const executedSql = [];
    const mockQuery = vi.fn(async (sql) => {
      executedSql.push(String(sql));
      return { rows: [], rowCount: 0 };
    });

    const engine = createTemplateEngine({
      tenantRepo: createPgTenantRepository({ query: mockQuery }),
      entitlements: createPgEntitlementService({ query: mockQuery }),
      permissions: createPgPermissionService({ query: mockQuery }),
      labels: createPgLabelService({ query: mockQuery }),
      customFields: createPgCustomFieldService({ query: mockQuery }),
      caseConfigs: createPgCaseConfigService({ query: mockQuery }),
    });

    await engine.createTenantFromTemplate({
      slug: 'hosp-pg',
      name: 'Hospital PG Persist',
      templateName: 'hospital',
      domain: 'hospital.cbox360.online',
    });

    const joined = executedSql.join('\n');
    expect(joined).toContain('INSERT INTO tenants');
    expect(joined).toContain('INSERT INTO tenant_domains');
    expect(joined).toContain('INSERT INTO tenant_settings');
    expect(joined).toContain('INSERT INTO tenant_entitlements');
    expect(joined).toContain('INSERT INTO tenant_labels');
    expect(joined).toContain('INSERT INTO tenant_roles');
    expect(joined).toContain('INSERT INTO field_definitions');
    expect(joined).toContain('INSERT INTO sla_policies');
    expect(joined).toContain('INSERT INTO case_categories');
  });
});
