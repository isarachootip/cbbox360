import { describe, it, expect } from 'vitest';
import express from 'express';
import { createInMemoryTenantRepository } from '../core/server/tenancy/tenantRepository.js';
import { createTenantResolverMiddleware } from '../core/server/tenancy/tenantResolverMiddleware.js';
import { createTenantBootstrapRouter } from '../core/server/tenancy/tenantBootstrapRoutes.js';
import { createTemplateEngine } from '../core/server/template-engine/templateApplier.js';
import { createTemplateAdminRouter } from '../core/server/template-engine/templateAdminRoutes.js';
import { createInMemoryEntitlementService } from '../core/server/entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../core/server/rbac/permissionService.js';
import { createInMemoryLabelService } from '../core/server/labels/labelService.js';
import { createInMemoryCustomFieldService } from '../core/server/custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../core/server/cases/caseConfigService.js';
import { createInMemoryCustomerRepository } from '../server/repositories/customerRepository.js';
import { createInMemoryConversationStore } from '../server/repositories/conversationRepository.js';
import { createInMemoryUserRepository } from '../server/repositories/userRepository.js';
import { createAuthService } from '../server/services/authService.js';
import { hashPassword, verifyPassword, decryptSecret } from '../server/utils/cryptoUtils.js';

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });

const makeSessionRepo = () => {
  const map = new Map();
  return {
    create: async (s) => map.set(s.id, s),
    findById: async (id) => map.get(id) ?? null,
    deleteById: async (id) => map.delete(id),
    deleteAllForUserExcept: async () => {},
  };
};

describe('Production Zero-Selection Multi-Tenancy, Tenant-Scoped Auth & On-Prem Mode', () => {
  it('locks customer subdomains to zero-selection mode, isolates tenant logins, and allows platform sysadmin support', async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const entitlements = createInMemoryEntitlementService();
    const permissions = createInMemoryPermissionService();
    const labels = createInMemoryLabelService();
    const customFields = createInMemoryCustomFieldService();
    const caseConfigs = createInMemoryCaseConfigService();
    const customerRepo = createInMemoryCustomerRepository();
    const convStore = createInMemoryConversationStore();
    const userRepo = createInMemoryUserRepository();

    await userRepo.insert(
      { id: 'u_sys', username: 'sysadmin', displayName: 'Platform Owner', role: 'sysadmin', initials: 'SA', passwordHash: await hashPassword('PlatformPass#2026') },
      'default'
    );
    await userRepo.insert(
      { id: 'u_b2b', username: 'b2b_agent', displayName: 'B2B Agent', role: 'SF_1', initials: 'BA', passwordHash: await hashPassword('B2BPass#2026') },
      'default'
    );

    const authService = createAuthService({
      userRepo,
      sessionRepo: makeSessionRepo(),
      hashPassword,
      verifyPassword,
      decryptSecret,
      getDummyHash: async () => hashPassword('dummy-constant-time'),
      sessionTtlHours: 8,
    });

    const engine = createTemplateEngine({
      tenantRepo, entitlements, permissions, labels, customFields, caseConfigs, customerRepo, convStore,
    });

    const app = express();
    app.use(express.json());
    app.use('/api', createTenantResolverMiddleware({ tenantRepo }));

    const requireAuth = (req, _res, next) => { req.user = { id: 'u_sys', username: 'sysadmin', role: 'sysadmin' }; next(); };
    const requireRole = (...roles) => (req, res, next) => (roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'FORBIDDEN' }));

    app.use('/api', createTenantBootstrapRouter({ requireAuth, tenantRepo, entitlements, permissions, labels, customFields, caseConfigs }));
    app.use('/api', createTemplateAdminRouter({ requireAuth, requireRole, engine, tenantRepo, userRepo, hashPassword }));
    app.post('/api/test-login', async (req, res) => {
      const out = await authService.login({ username: req.body.username, password: req.body.password, ip: '127.0.0.1', userAgent: 'vitest' });
      res.status(out.status === 'ok' ? 200 : 401).json(out);
    });

    const srv = await startServer(app);
    try {
      const createRes = await fetch(`${srv.url}/api/admin/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': 'cb360.online' },
        body: JSON.stringify({
          slug: 'hospital', name: 'โรงพยาบาลซีบ็อก360', template: 'hospital',
          domain: 'hospital.cb360.online', adminUsername: 'hosp_admin', adminPassword: 'HospPassword#2026',
        }),
      });
      expect(createRes.status).toBe(201);

      const rootBrand = await (await fetch(`${srv.url}/api/public/branding`, { headers: { 'X-Forwarded-Host': 'cb360.online' } })).json();
      expect(rootBrand.isControlPlane).toBe(true);

      const hospBrand = await (await fetch(`${srv.url}/api/public/branding`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online', 'x-tenant-slug': 'default' },
      })).json();
      expect(hospBrand.isControlPlane).toBe(false);
      expect(hospBrand.tenantSlug).toBe('hospital');

      const blockedAdmin = await fetch(`${srv.url}/api/admin/tenants`, { headers: { 'X-Forwarded-Host': 'hospital.cb360.online' } });
      expect(blockedAdmin.status).toBe(403);
      expect((await blockedAdmin.json()).error).toBe('CONTROL_PLANE_ONLY');

      const login = (host, username, password) =>
        fetch(`${srv.url}/api/test-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': host },
          body: JSON.stringify({ username, password }),
        });

      expect((await login('hospital.cb360.online', 'hosp_admin', 'HospPassword#2026')).status).toBe(200);
      expect((await login('cb360.online', 'hosp_admin', 'HospPassword#2026')).status).toBe(401);
      expect((await login('hospital.cb360.online', 'b2b_agent', 'B2BPass#2026')).status).toBe(401);
      expect((await login('hospital.cb360.online', 'sysadmin', 'PlatformPass#2026')).status).toBe(200);
    } finally {
      await srv.close();
    }
  });

  it('disables control plane completely when deploymentMode is single_tenant (On-Prem)', async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const app = express();
    app.use('/api', createTenantResolverMiddleware({ tenantRepo, deploymentMode: 'single_tenant' }));
    app.use('/api', createTenantBootstrapRouter({ requireAuth: (_r, _s, n) => n(), tenantRepo, deploymentMode: 'single_tenant' }));
    app.use('/api', createTemplateAdminRouter({ requireAuth: (_r, _s, n) => n(), requireRole: () => (_r, _s, n) => n(), tenantRepo, deploymentMode: 'single_tenant' }));

    const srv = await startServer(app);
    try {
      const brand = await (await fetch(`${srv.url}/api/public/branding`)).json();
      expect(brand.isControlPlane).toBe(false);
      expect(brand.deploymentMode).toBe('single_tenant');
      expect((await fetch(`${srv.url}/api/admin/tenants`)).status).toBe(403);
    } finally {
      await srv.close();
    }
  });
});
