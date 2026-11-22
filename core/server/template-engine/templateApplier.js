/**
 * templateApplier.js — Declarative Template Provisioning & Non-Destructive Upgrade Engine.
 * Provisions new tenants or upgrades existing tenants from `template.yaml` without overwriting custom edits.
 */
import fs from 'fs';
import path from 'path';
import {
  loadBuiltInTemplate,
  loadTemplateFromFile,
  validateTemplateObject,
} from './templateValidator.js';
import { applyTemplateSeedContacts } from './templateSeedLoader.js';
import { tenantRepository as defaultTenantRepo } from '../tenancy/tenantRepository.js';
import { entitlementService as defaultEntitlements } from '../entitlements/entitlementService.js';
import { permissionService as defaultPermissions } from '../rbac/permissionService.js';
import { labelService as defaultLabels } from '../labels/labelService.js';
import { customFieldService as defaultCustomFields } from '../custom-fields/customFieldService.js';
import { caseConfigService as defaultCaseConfigs } from '../cases/caseConfigService.js';
import { customerRepository as defaultCustomerRepo } from '../../../server/repositories/customerRepository.js';
import { conversationRepository as defaultConvStore } from '../../../server/repositories/conversationRepository.js';
import { caseRepository as defaultCaseRepo } from '../../../server/repositories/caseRepository.js';

const buildEntitlementMapFromTemplate = (ent = {}) => {
  const out = {};
  for (const m of ent.modules || []) out[`module:${m}`] = true;
  for (const c of ent.connectors || []) out[`connector:${c}`] = true;
  for (const f of ent.flags || []) out[`flag:${f}`] = true;
  return out;
};

export const createTemplateEngine = ({
  templatesDir = path.resolve(process.cwd(), 'templates'),
  tenantRepo = defaultTenantRepo,
  entitlements = defaultEntitlements,
  permissions = defaultPermissions,
  labels = defaultLabels,
  customFields = defaultCustomFields,
  caseConfigs = defaultCaseConfigs,
  customerRepo = defaultCustomerRepo,
  convStore = defaultConvStore,
  caseRepo = defaultCaseRepo,
} = {}) => {
  const listAvailableTemplates = () => {
    if (!fs.existsSync(templatesDir)) return [];
    return fs
      .readdirSync(templatesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(templatesDir, d.name, 'template.yaml')))
      .map((d) => {
        const tpl = loadBuiltInTemplate(d.name, templatesDir);
        return tpl.metadata;
      });
  };

  const importTemplateIntoTenant = async (tenantId, templateSource) => {
    const tpl =
      typeof templateSource === 'string'
        ? fs.existsSync(templateSource)
          ? loadTemplateFromFile(templateSource)
          : loadBuiltInTemplate(templateSource, templatesDir)
        : templateSource;

    const check = validateTemplateObject(tpl);
    if (!check.valid) {
      throw new Error(`INVALID_TEMPLATE: ${check.errors.join('; ')}`);
    }

    const existingTenant = await tenantRepo.findById(tenantId);
    if (!existingTenant) {
      throw new Error(`TENANT_NOT_FOUND: ${tenantId}`);
    }

    await tenantRepo.upsertTenant({
      ...existingTenant,
      templateId: tpl.metadata.id,
      templateVersion: tpl.metadata.version,
    });

    if (tpl.brandingDefaults || tpl.workflows || tpl.omnichannelPresets) {
      await tenantRepo.applyTemplateSettingsDefaults(tenantId, {
        ...(tpl.brandingDefaults ? { branding: tpl.brandingDefaults } : {}),
        ...(tpl.workflows ? { workflows: tpl.workflows } : {}),
        ...(tpl.omnichannelPresets
          ? {
              ivrScripts: {
                ivrGreeting: tpl.omnichannelPresets.ivrGreeting,
                agentCallScript: tpl.omnichannelPresets.agentCallScript,
              },
            }
          : {}),
      });
    }

    await entitlements.applyTemplateEntitlements(
      tenantId,
      buildEntitlementMapFromTemplate(tpl.entitlements)
    );

    for (const role of tpl.roles || []) {
      await permissions.upsertRole(tenantId, {
        roleKey: role.key,
        name: role.name,
        permissions: role.permissions,
        origin: 'template',
        isCustomized: false,
      });
    }

    for (const [locale, dict] of Object.entries(tpl.labels || {})) {
      await labels.applyTemplateLabels(tenantId, locale, dict);
    }

    const contactDefs = (tpl.customFields?.contact || []).map((f, idx) => ({
      ...f,
      entityType: 'contact',
      ui: { order: idx + 1, ...(f.ui || {}) },
    }));
    const caseDefs = (tpl.customFields?.case || []).map((f, idx) => ({
      ...f,
      entityType: 'case',
      ui: { order: idx + 1, ...(f.ui || {}) },
    }));
    await customFields.applyTemplateFieldDefs(tenantId, [...contactDefs, ...caseDefs]);
    await applyTemplateSeedContacts({
      tenantId,
      templateId: tpl.metadata.id,
      customFields,
      customerRepo,
      convStore,
      caseRepo,
      templatesDir,
    });

    await caseConfigs.applyTemplateCaseConfigs(tenantId, {
      slaPolicies: tpl.slaPolicies,
      caseCategories: tpl.caseCategories,
    });

    return {
      tenant: await tenantRepo.findById(tenantId),
      template: tpl.metadata,
    };
  };

  const createTenantFromTemplate = async ({ slug, name, templateName, domain, id }) => {
    const cleanSlug = String(slug || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(cleanSlug)) {
      throw new Error('INVALID_TENANT_SLUG');
    }
    const existing = await tenantRepo.findBySlug(cleanSlug);
    if (existing) {
      throw new Error(`TENANT_ALREADY_EXISTS: ${cleanSlug}`);
    }

    const tenantId = id || `tnt_${cleanSlug.replace(/-/g, '_')}`;
    await tenantRepo.upsertTenant({
      id: tenantId,
      slug: cleanSlug,
      name: name || cleanSlug,
      status: 'active',
    });

    if (domain) {
      await tenantRepo.bindDomain(domain, tenantId, true);
    }

    return importTemplateIntoTenant(tenantId, templateName);
  };

  return {
    listAvailableTemplates,
    createTenantFromTemplate,
    importTemplateIntoTenant,
  };
};

export const templateEngine = createTemplateEngine();
