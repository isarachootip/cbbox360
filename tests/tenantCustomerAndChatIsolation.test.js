import { describe, it, expect } from 'vitest';
import express from 'express';
import { createInMemoryTenantRepository } from '../core/server/tenancy/tenantRepository.js';
import { createTenantResolverMiddleware } from '../core/server/tenancy/tenantResolverMiddleware.js';
import { createTemplateEngine } from '../core/server/template-engine/templateApplier.js';
import { createInMemoryEntitlementService } from '../core/server/entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../core/server/rbac/permissionService.js';
import { createInMemoryLabelService } from '../core/server/labels/labelService.js';
import { createInMemoryCustomFieldService } from '../core/server/custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../core/server/cases/caseConfigService.js';
import { createCustomerController } from '../server/controllers/customerController.js';
import { createInMemoryCustomerRepository } from '../server/repositories/customerRepository.js';
import { createConversationHandlers, createInMemoryConversationStore } from '../server/controllers/conversationController.js';
import { createTenantBootstrapRouter } from '../core/server/tenancy/tenantBootstrapRoutes.js';

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

const makeSampleRecord = (id, name) => ({
  id,
  name,
  customerType: 'INDIVIDUAL',
  initials: name.slice(0, 2),
  tier: 'MEMBER',
  creditGrade: 'A',
  segments: ['ทั่วไป'],
  lifetimeValue: 0,
  spend12Months: 0,
  orders12Months: 0,
  lastOrderDaysAgo: 0,
  lastOrderCode: '-',
  lastOrderAmount: 0,
  tierValidUntil: '31 ธ.ค. 2026',
  tierProgressPercent: 50,
  tierTargetSpend: 10000,
  phone: '081-111-2222',
  fullPhone: '0811112222',
  email: 'test@example.com',
  channels: { line: true, facebook: false },
  birthday: '1 ม.ค. 1990',
  customerSince: '2026',
  consent: { marketingLine: true, marketingEmail: false, marketingSms: false },
  creditLimit: 0,
  creditUsed: 0,
  creditOverdue: 0,
  churnRisk: 'ต่ำ',
  nextBestAction: { description: 'ติดตามอาการ', actionLabel: 'โทรติดตาม' },
});

describe('Strict Per-Tenant Isolation — Customers, Conversations & Workspace Seed', () => {
  it('isolates hospital.cb360.online patients and chats completely from default cb360.online', async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const entitlements = createInMemoryEntitlementService();
    const permissions = createInMemoryPermissionService();
    const labels = createInMemoryLabelService();
    const customFields = createInMemoryCustomFieldService();
    const caseConfigs = createInMemoryCaseConfigService();
    const customerRepo = createInMemoryCustomerRepository();
    const convStore = createInMemoryConversationStore();

    const engine = createTemplateEngine({
      tenantRepo,
      entitlements,
      permissions,
      labels,
      customFields,
      caseConfigs,
      customerRepo,
      convStore,
    });

    await engine.createTenantFromTemplate({
      slug: 'hospital',
      name: 'โรงพยาบาลซีบ็อก360',
      templateName: 'hospital',
      domain: 'hospital.cb360.online',
    });

    const app = express();
    app.use(express.json());
    app.use('/api', createTenantResolverMiddleware({ tenantRepo }));

    const requireAuth = (req, _res, next) => {
      req.user = { id: 'u1', username: 'sysadmin', role: 'sysadmin' };
      next();
    };

    const custCtrl = createCustomerController({
      repo: customerRepo,
      audit: async () => {},
      tenantRepo,
      customFields,
    });
    const convCtrl = createConversationHandlers({
      store: convStore,
      tenantRepo,
    });

    app.get('/api/customers', requireAuth, custCtrl.listCustomers);
    app.post('/api/customers', requireAuth, custCtrl.createCustomer);
    app.get('/api/conversations', requireAuth, convCtrl.getConversations);
    app.use(
      '/api',
      createTenantBootstrapRouter({
        requireAuth,
        tenantRepo,
        entitlements,
        permissions,
        labels,
        customFields,
        caseConfigs,
      })
    );

    const srv = await startServer(app);
    try {
      // 1. Create a B2B customer on default tenant (cb360.online)
      const createDef = await fetch(`${srv.url}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': 'cb360.online' },
        body: JSON.stringify({ customer: makeSampleRecord('B2B-900', 'บจก. สยามค้าส่ง') }),
      });
      expect(createDef.status).toBe(201);

      // 2. Query hospital.cb360.online -> MUST have Hospital patients ONLY, NEVER B2B-900 or สมชาย ใจดี!
      const hospCustRes = await fetch(`${srv.url}/api/customers`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online' },
      });
      const hospCustBody = await hospCustRes.json();
      const hospNames = hospCustBody.customers.map((c) => c.name);
      expect(hospNames).toContain('กานดา สุขสวัสดิ์');
      expect(hospNames).not.toContain('บจก. สยามค้าส่ง');
      expect(hospNames).not.toContain('สมชาย ใจดี');

      // 3. Query hospital.cb360.online conversations -> Hospital medical chats ONLY!
      const hospConvRes = await fetch(`${srv.url}/api/conversations`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online' },
      });
      const hospConvBody = await hospConvRes.json();
      expect(hospConvBody.data.length).toBeGreaterThanOrEqual(2);
      expect(hospConvBody.data[0].customerName).toBe('กานดา สุขสวัสดิ์');
      expect(JSON.stringify(hospConvBody.data)).not.toContain('SO-10482');

      // 4. Query default tenant customers -> sees B2B-900, NEVER sees Hospital patient กานดา สุขสวัสดิ์!
      const defCustRes = await fetch(`${srv.url}/api/customers`, {
        headers: { 'X-Forwarded-Host': 'cb360.online' },
      });
      const defCustBody = await defCustRes.json();
      const defNames = defCustBody.customers.map((c) => c.name);
      expect(defNames).toContain('บจก. สยามค้าส่ง');
      expect(defNames).not.toContain('กานดา สุขสวัสดิ์');

      // 5. Bootstrap seed-workspace endpoint returns Hospital tickets & timeline
      const wsRes = await fetch(`${srv.url}/api/tenant/seed-workspace`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online' },
      });
      expect(wsRes.status).toBe(200);
      const wsBody = await wsRes.json();
      expect(wsBody.tickets.length).toBeGreaterThan(0);
      expect(wsBody.deals).toEqual([]);
    } finally {
      await srv.close();
    }
  });
});
