/**
 * templateAdminRoutes.js — Control-Plane REST Admin API for Tenant Provisioning & Template Lifecycle.
 * Strictly locked to Control Plane hosts (disabled on customer subdomains and On-Prem single_tenant mode).
 */
import { Router } from 'express';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';
import { validateTemplateObject } from './templateValidator.js';
import { templateEngine as defaultEngine } from './templateApplier.js';
import { exportTenantTemplateYaml } from './templateExporter.js';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';
import { userRepository as defaultUserRepo } from '../../../server/repositories/userRepository.js';
import { hashPassword as defaultHashPassword } from '../../../server/utils/cryptoUtils.js';

const patchTenantSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  domain: z.string().trim().min(3).max(255).optional(),
});

export const createTemplateAdminRouter = ({
  requireAuth,
  requireRole,
  engine = defaultEngine,
  tenantRepo = defaultTenantRepo,
  userRepo = defaultUserRepo,
  hashPassword = defaultHashPassword,
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
}) => {
  const router = Router();

  const requireControlPlane = (req, res, next) => {
    const mode = req.deploymentMode || deploymentMode;
    if (mode === 'single_tenant' || req.isControlPlaneHost === false) {
      return res.status(403).json({
        success: false,
        error: 'CONTROL_PLANE_ONLY',
        message: 'การจัดการองค์กรอนุญาตเฉพาะบนโดเมนกลางของผู้ให้บริการเท่านั้น',
      });
    }
    return next();
  };

  const guard = [requireControlPlane, requireAuth, requireRole('sysadmin')];

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

  router.get('/admin/tenants', ...guard, async (_req, res) => {
    try {
      const rows = await tenantRepo.listTenants();
      const enriched = await Promise.all(
        rows.map(async (t) => {
          const [domains, settings] = await Promise.all([
            tenantRepo.listDomainsByTenant ? tenantRepo.listDomainsByTenant(t.id) : [],
            tenantRepo.getTenantSettings(t.id),
          ]);
          return { ...t, domains, branding: settings.branding };
        })
      );
      return res.status(200).json({ success: true, tenants: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/admin/tenants', ...guard, async (req, res) => {
    try {
      const { slug, name, template, domain, adminUsername, adminPassword } = req.body || {};
      if (adminUsername && (!adminPassword || String(adminPassword).length < 8)) {
        return res.status(400).json({
          success: false,
          error: 'รหัสผ่านผู้ดูแลองค์กรต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
        });
      }

      const created = await engine.createTenantFromTemplate({
        slug,
        name,
        templateName: template,
        domain: domain ? String(domain).trim() : undefined,
      });

      let provisionedAdmin = null;
      if (adminUsername && adminPassword && userRepo?.insert) {
        const cleanUser = String(adminUsername).trim();
        await userRepo.insert(
          {
            id: `usr_${created.tenant.id}_${Date.now()}`,
            username: cleanUser,
            displayName: `ผู้ดูแลระบบ (${created.tenant.name})`,
            email: `${cleanUser}@${created.tenant.slug}.local`,
            role: 'admin',
            department: 'Organization Administration',
            initials: cleanUser.slice(0, 2).toUpperCase(),
            passwordHash: await hashPassword(String(adminPassword)),
            mustChangePassword: false,
            isActive: true,
          },
          created.tenant.id
        );
        provisionedAdmin = { username: cleanUser, role: 'admin' };
      }

      const domains = tenantRepo.listDomainsByTenant
        ? await tenantRepo.listDomainsByTenant(created.tenant.id)
        : domain
          ? [String(domain).trim().toLowerCase()]
          : [];
      return res.status(201).json({ success: true, ...created, domains, provisionedAdmin });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  router.patch('/admin/tenants/:slug', ...guard, async (req, res) => {
    const parsed = patchTenantSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'INVALID_TENANT_PATCH' });
    }
    const existing = await tenantRepo.findBySlug(String(req.params.slug));
    if (!existing) return res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });

    const updated = await tenantRepo.upsertTenant({
      ...existing,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    });
    if (parsed.data.domain) await tenantRepo.bindDomain(parsed.data.domain, updated.id, true);
    const domains = tenantRepo.listDomainsByTenant ? await tenantRepo.listDomainsByTenant(updated.id) : [];
    return res.status(200).json({ success: true, tenant: updated, domains });
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
