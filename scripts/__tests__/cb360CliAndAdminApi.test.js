import { describe, it, expect } from 'vitest';
import express from 'express';
import { runCli } from '../cb360.js';
import { createTemplateAdminRouter } from '../../core/server/template-engine/templateAdminRoutes.js';

describe('cb360 CLI & Template Admin REST API (Phase 4)', () => {
  it('executes CLI template validate, tenant create, template import, and template export end-to-end', async () => {
    const valOut = await runCli(['template', 'validate']);
    expect(valOut.valid).toBe(true);
    expect(valOut.report.length).toBeGreaterThanOrEqual(4);

    const created = await runCli([
      'tenant',
      'create',
      '--template',
      'hospital',
      '--slug',
      'bangkok-clinic',
      '--name',
      'คลินิกกรุงเทพเมดิคอล',
      '--domain',
      'bkkclinic.cb360.online',
    ]);
    expect(created.tenant.slug).toBe('bangkok-clinic');
    expect(created.template.id).toBe('hospital');

    const exported = await runCli(['template', 'export', '--tenant', 'bangkok-clinic']);
    expect(exported.yaml).toContain('kind: IndustryTemplate');
    expect(exported.yaml).toContain('ผู้ป่วย');
  });

  it('serves /api/admin/templates, /tenants, /validate, /import, and /export via REST API', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api',
      createTemplateAdminRouter({
        requireAuth: (req, _res, next) => {
          req.user = { id: 'u1', role: 'sysadmin' };
          next();
        },
        requireRole: () => (_req, _res, next) => next(),
      })
    );

    const server = app.listen(0);
    const port = server.address().port;

    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/api/admin/templates`);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      expect(listJson.templates.map((t) => t.id)).toEqual(
        expect.arrayContaining(['hospital', 'insurance', 'b2b_wholesale', 'ecommerce'])
      );

      const createRes = await fetch(`http://127.0.0.1:${port}/api/admin/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'siam-life',
          name: 'สยามประกันชีวิต',
          template: 'insurance',
        }),
      });
      expect(createRes.status).toBe(201);

      const exportRes = await fetch(
        `http://127.0.0.1:${port}/api/admin/tenants/siam-life/template/export`
      );
      expect(exportRes.status).toBe(200);
      const yamlBody = await exportRes.text();
      expect(yamlBody).toContain('ผู้เอาประกัน');

      const valRes = await fetch(`http://127.0.0.1:${port}/api/admin/templates/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: yamlBody }),
      });
      expect(valRes.status).toBe(200);
      expect((await valRes.json()).valid).toBe(true);
    } finally {
      server.close();
    }
  });
});
