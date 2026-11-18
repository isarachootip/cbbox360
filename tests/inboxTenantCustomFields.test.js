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
import { createCustomFieldRouter } from '../core/server/custom-fields/customFieldRoutes.js';

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

describe('Inbox Contact Custom Fields — Hospital Seed, HN Uniqueness & PDPA s.26 Redaction', () => {
  it('seeds C00123 patient fields for hospital, enforces unique HN, and redacts allergies by role', async () => {
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
      const role = String(req.headers['x-test-role'] || 'sysadmin');
      req.user = { id: 'u1', username: role, role };
      next();
    };
    app.use(
      '/api',
      createCustomFieldRouter({
        requireAuth,
        cfService: customFields,
        permService: permissions,
        audit: async () => {},
      })
    );

    const srv = await startServer(app);
    try {
      // 1. Doctor / Sysadmin sees full HN001 patient fields + danger allergy banner from seed.yaml
      const docRes = await fetch(`${srv.url}/api/contacts/HN001/custom-fields`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online', 'x-test-role': 'doctor' },
      });
      expect(docRes.status).toBe(200);
      const docBody = await docRes.json();
      expect(docBody.values.hn).toBe('HN-6904812');
      expect(docBody.values.drug_allergies).toEqual(['Penicillin', 'Ibuprofen']);
      expect(docBody.values.treatment_right).toBe('PRIVATE_INSURANCE');
      expect(docBody.values.preferred_department).toBe('ศูนย์อายุรกรรมหัวใจ');
      expect(docBody.values.preferred_doctor).toBe('นพ. กิตติพงศ์ วงศ์เวช');
      expect(docBody.banners).toHaveLength(1);
      expect(docBody.banners[0].severity).toBe('danger');
      expect(docBody.banners[0].text).toContain('Penicillin');

      // 2. Admission agent (no contact.pdpa_s26:read) gets redacted allergy + PDPA notice banner
      const agentRes = await fetch(`${srv.url}/api/contacts/HN001/custom-fields`, {
        headers: { 'X-Forwarded-Host': 'hospital.cb360.online', 'x-test-role': 'admission_agent' },
      });
      const agentBody = await agentRes.json();
      expect(agentBody.values.hn).toBe('HN-6904812');
      expect(agentBody.values.drug_allergies).toBeUndefined();
      expect(agentBody.redactedFlags.drug_allergies).toEqual({ redacted: true, hasValue: true });
      expect(agentBody.banners[0].redacted).toBe(true);
      expect(agentBody.banners[0].text).toContain('PDPA ม.26');

      // 3. Duplicate HN across another patient (C00999) is rejected with 400 DUPLICATE_CUSTOM_FIELD
      const dupRes = await fetch(`${srv.url}/api/contacts/C00999/custom-fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Host': 'hospital.cb360.online',
          'x-test-role': 'doctor',
        },
        body: JSON.stringify({ values: { hn: 'HN-6904812' } }),
      });
      expect(dupRes.status).toBe(400);
      const dupBody = await dupRes.json();
      expect(dupBody.error).toBe('DUPLICATE_CUSTOM_FIELD');
    } finally {
      await srv.close();
    }
  });
});
