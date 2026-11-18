/**
 * templateExporter.js — Exports a tenant's live runtime configuration to a clean `template.yaml` string.
 * Excludes all customer PII and connector secrets so exported YAML is safe to version-control or share.
 */
import { stringify as stringifyYaml } from 'yaml';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';
import { entitlementService as defaultEntitlements } from '../entitlements/entitlementService.js';
import { permissionService as defaultPermissions } from '../rbac/permissionService.js';
import { labelService as defaultLabels } from '../labels/labelService.js';
import { customFieldService as defaultCustomFields } from '../custom-fields/customFieldService.js';
import { caseConfigService as defaultCaseConfigs } from '../cases/caseConfigService.js';

const stripInternalFieldProps = (def) => {
  const out = {
    key: def.key,
    label: def.label,
    type: def.type,
  };
  if (def.isIndexed) out.isIndexed = true;
  if (def.options?.length) out.options = def.options;
  if (def.validation && Object.keys(def.validation).length) out.validation = def.validation;
  if (def.sensitivity && def.sensitivity !== 'normal') out.sensitivity = def.sensitivity;
  if (def.acl && Object.keys(def.acl).length) out.acl = def.acl;
  if (def.ui && Object.keys(def.ui).length) out.ui = def.ui;
  return out;
};

export const exportTenantTemplateYaml = async ({
  tenantId,
  tenantRepo = defaultTenantRepo,
  entitlements = defaultEntitlements,
  permissions = defaultPermissions,
  labels = defaultLabels,
  customFields = defaultCustomFields,
  caseConfigs = defaultCaseConfigs,
}) => {
  const tenant = await tenantRepo.findById(tenantId);
  if (!tenant) throw new Error(`TENANT_NOT_FOUND: ${tenantId}`);

  const [settings, entMap, roleList, thLabels, contactDefs, caseDefs, slas, categories] =
    await Promise.all([
      tenantRepo.getTenantSettings(tenantId),
      entitlements.getEntitlementMap(tenantId),
      permissions.listRoles(tenantId),
      labels.getTenantLabels(tenantId, 'th'),
      customFields.listFieldDefs(tenantId, 'contact'),
      customFields.listFieldDefs(tenantId, 'case'),
      caseConfigs.listSlaPolicies(tenantId),
      caseConfigs.listCategories(tenantId),
    ]);

  const modules = [];
  const connectors = [];
  const flags = [];
  for (const [k, enabled] of Object.entries(entMap)) {
    if (!enabled) continue;
    if (k.startsWith('module:')) modules.push(k.slice('module:'.length));
    else if (k.startsWith('connector:')) connectors.push(k.slice('connector:'.length));
    else if (k.startsWith('flag:')) flags.push(k.slice('flag:'.length));
  }

  const exportedObject = {
    apiVersion: 'cb360.io/v1',
    kind: 'IndustryTemplate',
    metadata: {
      id: tenant.templateId || tenant.slug,
      version: tenant.templateVersion || '1.0.0',
      industry: 'custom',
      name: `${tenant.name} Exported Template`,
      thaiTitle: tenant.name,
    },
    entitlements: { modules, connectors, flags },
    brandingDefaults: {
      primaryColor: settings.branding?.primaryColor || '#1F6FD1',
      ...(settings.branding?.accentColor ? { accentColor: settings.branding.accentColor } : {}),
    },
    labels: {
      th: Object.keys(thLabels).length > 0 ? thLabels : { 'contact.singular': 'ลูกค้า' },
    },
    roles: roleList
      .filter((r) => r.origin !== 'system')
      .map((r) => ({ key: r.roleKey, name: r.name, permissions: r.permissions })),
    customFields: {
      contact: contactDefs.map(stripInternalFieldProps),
      ...(caseDefs.length > 0 ? { case: caseDefs.map(stripInternalFieldProps) } : {}),
    },
    slaPolicies:
      slas.length > 0
        ? slas.map((s) => ({
            slug: s.slug,
            name: s.name,
            firstResponseMinutes: s.firstResponseMinutes,
            resolutionMinutes: s.resolutionMinutes,
          }))
        : [{ slug: 'standard', name: 'Standard SLA', firstResponseMinutes: 60, resolutionMinutes: 480 }],
    caseCategories:
      categories.length > 0
        ? categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            slaPolicySlug: c.slaPolicySlug,
            defaultQueue: c.defaultQueue,
          }))
        : [{ slug: 'inquiry', name: 'สอบถามทั่วไป', slaPolicySlug: 'standard', defaultQueue: 'General' }],
  };

  return stringifyYaml(exportedObject);
};
