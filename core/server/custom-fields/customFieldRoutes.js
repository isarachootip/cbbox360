/**
 * customFieldRoutes.js — Industry-agnostic REST endpoints for Custom Field Definitions & Contact Values.
 * Automatically enforces field-level PDPA sensitivity redaction, edit ACLs, and audit logging.
 */
import { Router } from 'express';
import { getCurrentTenantId } from '../tenancy/tenantContext.js';
import { customFieldService as defaultCfService } from './customFieldService.js';
import { permissionService as defaultPermService } from '../rbac/permissionService.js';
import { redactCustomFields, verifyCustomFieldWriteAccess } from './fieldRedactor.js';
import { writeAuditLog as defaultAudit } from '../../../server/services/auditService.js';
import { loadTemplateSeedContacts } from '../template-engine/templateSeedLoader.js';

export const createCustomFieldRouter = ({
  requireAuth,
  cfService = defaultCfService,
  permService = defaultPermService,
  audit = defaultAudit,
}) => {
  const router = Router();

  router.get('/custom-fields/:entityType/definitions', requireAuth, async (req, res) => {
    const tenantId = getCurrentTenantId();
    const defs = await cfService.listFieldDefs(tenantId, String(req.params.entityType));
    return res.status(200).json({ success: true, definitions: defs });
  });

  router.get('/contacts/:contactId/custom-fields', requireAuth, async (req, res) => {
    const tenantId = getCurrentTenantId();
    const contactId = String(req.params.contactId);
    let [defs, rawValues, grantedPermissions] = await Promise.all([
      cfService.listFieldDefs(tenantId, 'contact'),
      cfService.getEntityFields(tenantId, 'contact', contactId),
      permService.getRolePermissions(tenantId, req.user?.role),
    ]);

    if (defs.length > 0 && (!rawValues || Object.keys(rawValues).length === 0) && req.tenant?.templateId) {
      const seedMatch = loadTemplateSeedContacts(req.tenant.templateId).find(
        (c) => String(c.id).toLowerCase() === contactId.toLowerCase()
      );
      if (seedMatch?.customFields) {
        const seeded = await cfService.validateAndSaveEntityFields({
          tenantId,
          entityType: 'contact',
          entityId: contactId,
          values: seedMatch.customFields,
        });
        if (seeded.ok) rawValues = seeded.values;
      }
    }

    const redacted = await redactCustomFields({
      defs,
      values: rawValues,
      grantedPermissions,
      onSensitiveAccess: async (keys) => {
        await audit({
          userId: req.user?.username || req.user?.id || 'unknown',
          userRole: req.user?.role,
          action: 'SENSITIVE_CUSTOM_FIELD_VIEW',
          category: 'data',
          resource: `Contact/${contactId}`,
          ip: req.ip,
          details: `tenant=${tenantId} fields=${keys.join(',')}`,
        });
      },
    });

    return res.status(200).json({
      success: true,
      definitions: defs,
      values: redacted.values,
      redactedFlags: redacted.redactedFlags,
      banners: redacted.banners,
    });
  });

  router.put('/contacts/:contactId/custom-fields', requireAuth, async (req, res) => {
    const tenantId = getCurrentTenantId();
    const contactId = String(req.params.contactId);
    const nextValues = req.body?.values || {};

    const [defs, beforeValues, grantedPermissions] = await Promise.all([
      cfService.listFieldDefs(tenantId, 'contact'),
      cfService.getEntityFields(tenantId, 'contact', contactId),
      permService.getRolePermissions(tenantId, req.user?.role),
    ]);

    const accessCheck = verifyCustomFieldWriteAccess({
      defs,
      beforeValues,
      afterValues: nextValues,
      grantedPermissions,
    });

    if (!accessCheck.ok) {
      await audit({
        userId: req.user?.username || req.user?.id || 'unknown',
        userRole: req.user?.role,
        action: 'CUSTOM_FIELD_UPDATE_DENIED',
        category: 'security',
        resource: `Contact/${contactId}`,
        ip: req.ip,
        details: `tenant=${tenantId} forbidden=${accessCheck.forbiddenFields.join(',')}`,
      });
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_CUSTOM_FIELDS',
        forbiddenFields: accessCheck.forbiddenFields,
      });
    }

    const saved = await cfService.validateAndSaveEntityFields({
      tenantId,
      entityType: 'contact',
      entityId: contactId,
      values: nextValues,
    });

    if (!saved.ok) {
      return res.status(400).json({ success: false, error: saved.code, errors: saved.errors });
    }

    await audit({
      userId: req.user?.username || req.user?.id || 'unknown',
      userRole: req.user?.role,
      action: 'CUSTOM_FIELD_UPDATE',
      category: 'data',
      resource: `Contact/${contactId}`,
      ip: req.ip,
      details: `tenant=${tenantId} changed=${accessCheck.changedFields.join(',')}`,
    });

    return res.status(200).json({ success: true, values: saved.values });
  });

  return router;
};
