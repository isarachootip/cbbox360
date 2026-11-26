/**
 * tenantBootstrapRoutes.js — Runtime White-Label Branding & Authenticated Tenant Bootstrap APIs.
 */
import { Router } from 'express';
import { z } from 'zod';
import { getCurrentTenantId } from './tenantContext.js';
import { tenantRepository } from './tenantRepository.js';
import { entitlementService } from '../entitlements/entitlementService.js';
import { permissionService } from '../rbac/permissionService.js';
import { labelService } from '../labels/labelService.js';
import { customFieldService } from '../custom-fields/customFieldService.js';
import { caseConfigService } from '../cases/caseConfigService.js';
import { loadTemplateSeedBundle } from '../template-engine/templateSeedLoader.js';

const brandingPatchSchema = z.object({
  branding: z
    .object({
      appName: z.string().trim().min(1).max(80).optional(),
      logoUrl: z.string().trim().max(300).optional(),
      iconUrl: z.string().trim().max(300).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .optional(),
  businessHours: z.record(z.string(), z.unknown()).optional(),
  ivrScripts: z.record(z.string(), z.unknown()).optional(),
});

export const createTenantBootstrapRouter = ({
  requireAuth,
  tenantRepo = tenantRepository,
  entitlements = entitlementService,
  permissions = permissionService,
  labels = labelService,
  customFields = customFieldService,
  caseConfigs = caseConfigService,
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
}) => {
  const router = Router();

  const resolveControlPlaneFlag = (req) => {
    const mode = req.deploymentMode || deploymentMode;
    if (mode === 'single_tenant') return false;
    return req.isControlPlaneHost !== undefined ? Boolean(req.isControlPlaneHost) : true;
  };

  router.get('/public/branding', async (req, res) => {
    const tenantId = getCurrentTenantId();
    const tenant = req.tenant || (await tenantRepo.findById(tenantId));
    const settings = await tenantRepo.getTenantSettings(tenantId);
    return res.status(200).json({
      success: true,
      tenantId,
      tenantSlug: tenant?.slug || tenantId,
      tenantName: tenant?.name || 'CusBox360',
      templateId: tenant?.templateId || null,
      isControlPlane: resolveControlPlaneFlag(req),
      deploymentMode: req.deploymentMode || deploymentMode,
      branding: settings.branding,
    });
  });

  router.get('/tenant/bootstrap', requireAuth, async (req, res) => {
    const tenantId = getCurrentTenantId();
    const tenant = req.tenant || (await tenantRepo.findById(tenantId));
    const [settings, entitlementMap, grantedPerms, labelMap, contactFieldDefs, caseCategories] =
      await Promise.all([
        tenantRepo.getTenantSettings(tenantId),
        entitlements.getEntitlementMap(tenantId),
        permissions.getRolePermissions(tenantId, req.user?.role),
        labels.getTenantLabels(tenantId, 'th'),
        customFields.listFieldDefs(tenantId, 'contact'),
        caseConfigs.listCategories(tenantId),
      ]);

    return res.status(200).json({
      success: true,
      isControlPlane: resolveControlPlaneFlag(req),
      deploymentMode: req.deploymentMode || deploymentMode,
      tenant: {
        id: tenantId,
        slug: tenant?.slug || tenantId,
        name: tenant?.name || 'CusBox360',
        templateId: tenant?.templateId || null,
      },
      branding: settings.branding,
      entitlements: entitlementMap,
      permissions: grantedPerms,
      labels: labelMap,
      contactFieldDefs,
      caseCategories,
    });
  });

  router.patch(
    '/tenant/settings',
    requireAuth,
    permissions.requirePermission('admin:settings'),
    async (req, res) => {
      const parsed = brandingPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'INVALID_SETTINGS_PAYLOAD' });
      }
      const tenantId = getCurrentTenantId();
      const updated = await tenantRepo.updateTenantSettings(tenantId, parsed.data, {
        markCustomized: true,
      });
      return res.status(200).json({ success: true, settings: updated });
    }
  );

  router.get('/tenant/seed-workspace', requireAuth, async (req, res) => {
    const tenantId = getCurrentTenantId();
    const tenant = req.tenant || (await tenantRepo.findById(tenantId));
    const bundle = loadTemplateSeedBundle(tenant?.templateId);
    return res.status(200).json({
      success: true,
      tenantId,
      templateId: tenant?.templateId || null,
      tickets: bundle.tickets,
      timelineEvents: bundle.timelineEvents,
      deals: bundle.deals,
      creditAccounts: bundle.creditAccounts,
      creditRequests: bundle.creditRequests,
      callLogs: bundle.callLogs,
    });
  });

  return router;
};
