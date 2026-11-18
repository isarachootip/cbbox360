/**
 * tenantBootstrapRoutes.js — Runtime White-Label Branding & Authenticated Tenant Bootstrap APIs.
 * - GET /api/public/branding: Unauthenticated white-label config resolved by Host / Subdomain.
 * - GET /api/tenant/bootstrap: Authenticated bundle of entitlements, labels, permissions, and field definitions.
 * - PATCH /api/tenant/settings: Tenant admin white-label / config customization (marks customized_paths).
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
}) => {
  const router = Router();

  router.get('/public/branding', async (req, res) => {
    const tenantId = getCurrentTenantId();
    const tenant = req.tenant || (await tenantRepo.findById(tenantId));
    const settings = await tenantRepo.getTenantSettings(tenantId);
    return res.status(200).json({
      success: true,
      tenantId,
      tenantSlug: tenant?.slug || tenantId,
      tenantName: tenant?.name || 'CusBox360',
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
      tenant: { id: tenantId, slug: tenant?.slug || tenantId, name: tenant?.name || 'CusBox360' },
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

  return router;
};
