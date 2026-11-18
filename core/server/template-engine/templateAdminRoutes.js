/**
 * templateAdminRoutes.js — REST Admin API for Tenant Provisioning & Template Validate/Import/Export.
 */
import { Router } from 'express';
import { parse as parseYaml } from 'yaml';
import { validateTemplateObject } from './templateValidator.js';
import { templateEngine as defaultEngine } from './templateApplier.js';
import { exportTenantTemplateYaml } from './templateExporter.js';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';

export const createTemplateAdminRouter = ({
  requireAuth,
  requireRole,
  engine = defaultEngine,
  tenantRepo = defaultTenantRepo,
}) => {
  const router = Router();
  const guard = [requireAuth, requireRole('sysadmin')];

  router.get('/admin/templates', ...guard, (_req, res) => {
    return res.status(200).json({ success: true, templates: engine.listAvailableTemplates() });
  });

  router.post('/admin/templates/validate', ...guard, (req, res) => {
    try {
      const candidate =
        typeof req.body?.yaml === 'string' ? parseYaml(req.body.yaml) : req.body?.template;
      const result = validateTemplateObject(candidate);
      return res.status(result.valid ? 200 : 400).json({ success: result.valid, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, valid: false, errors: [err.message] });
    }
  });

  router.post('/admin/tenants', ...guard, async (req, res) => {
    try {
      const { slug, name, template, domain } = req.body || {};
      const created = await engine.createTenantFromTemplate({
        slug,
        name,
        templateName: template,
        domain,
      });
      return res.status(201).json({ success: true, ...created });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/admin/tenants/:slug/template/import', ...guard, async (req, res) => {
    try {
      const tenant = await tenantRepo.findBySlug(String(req.params.slug));
      if (!tenant) return res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });

      const source =
        typeof req.body?.yaml === 'string'
          ? parseYaml(req.body.yaml)
          : req.body?.template || req.body?.templateName;
      const result = await engine.importTemplateIntoTenant(tenant.id, source);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  router.get('/admin/tenants/:slug/template/export', ...guard, async (req, res) => {
    try {
      const tenant = await tenantRepo.findBySlug(String(req.params.slug));
      if (!tenant) return res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });

      const yaml = await exportTenantTemplateYaml({ tenantId: tenant.id });
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      return res.status(200).send(yaml);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
};
