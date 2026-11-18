/**
 * pgTenantQueries.js — PostgreSQL persistence operations for `tenants`, `tenant_domains`, and `tenant_settings`.
 * Falls back cleanly to the provided in-memory store when PostgreSQL is unavailable in unit/smoke tests.
 */
import { DEFAULT_BRANDING } from './tenantRepository.js';

export const rowToTenant = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  status: r.status,
  templateId: r.template_id,
  templateVersion: r.template_version,
  isolationMode: r.isolation_mode,
  dbDsnEncrypted: r.db_dsn_encrypted,
});

const rowToSettings = (r) => ({
  tenantId: r.tenant_id,
  branding: { ...DEFAULT_BRANDING, ...(r.branding || {}) },
  businessHours: r.business_hours || {},
  ivrScripts: r.ivr_scripts || {},
  workflows: Array.isArray(r.workflows) ? r.workflows : [],
  generalConfig: r.general_config || { defaultLanguage: 'th', currency: 'THB' },
  customizedPaths: Array.isArray(r.customized_paths) ? r.customized_paths : [],
});

export const createPgTenantOperations = ({ query, fallback, normalizeHost }) => ({
  async listTenants() {
    try {
      const r = await query(`SELECT * FROM tenants ORDER BY created_at ASC`);
      if (r?.rows?.length > 0) return r.rows.map(rowToTenant);
    } catch { /* fallback */ }
    return fallback.listTenants();
  },

  async listDomainsByTenant(tenantId) {
    try {
      const r = await query(
        `SELECT hostname FROM tenant_domains WHERE tenant_id = $1 ORDER BY is_primary DESC, hostname ASC`,
        [tenantId]
      );
      if (r?.rows?.length > 0) return r.rows.map((d) => d.hostname);
    } catch { /* fallback */ }
    return fallback.listDomainsByTenant(tenantId);
  },

  async upsertTenant(input) {
    const saved = await fallback.upsertTenant(input);
    try {
      await query(
        `INSERT INTO tenants (id, slug, name, status, template_id, template_version, isolation_mode, db_dsn_encrypted, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           template_id = COALESCE(EXCLUDED.template_id, tenants.template_id),
           template_version = COALESCE(EXCLUDED.template_version, tenants.template_version),
           isolation_mode = EXCLUDED.isolation_mode,
           db_dsn_encrypted = COALESCE(EXCLUDED.db_dsn_encrypted, tenants.db_dsn_encrypted),
           updated_at = NOW()`,
        [
          saved.id,
          saved.slug,
          saved.name,
          saved.status,
          saved.templateId,
          saved.templateVersion,
          saved.isolationMode,
          saved.dbDsnEncrypted,
        ]
      );
    } catch { /* fallback */ }
    return saved;
  },

  async bindDomain(hostname, tenantId, isPrimary = false) {
    const saved = await fallback.bindDomain(hostname, tenantId, isPrimary);
    const host = normalizeHost(hostname);
    try {
      await query(
        `INSERT INTO tenant_domains (hostname, tenant_id, is_primary)
         VALUES ($1, $2, $3)
         ON CONFLICT (hostname) DO UPDATE SET
           tenant_id = EXCLUDED.tenant_id,
           is_primary = EXCLUDED.is_primary`,
        [host, tenantId, Boolean(isPrimary)]
      );
    } catch { /* fallback */ }
    return saved;
  },

  async getTenantSettings(tenantId) {
    try {
      const r = await query(`SELECT * FROM tenant_settings WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
      if (r?.rows?.[0]) return rowToSettings(r.rows[0]);
    } catch { /* fallback */ }
    return fallback.getTenantSettings(tenantId);
  },

  async persistSettings(saved) {
    try {
      await query(
        `INSERT INTO tenant_settings (tenant_id, branding, business_hours, ivr_scripts, workflows, general_config, customized_paths, updated_at)
         VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::text[], NOW())
         ON CONFLICT (tenant_id) DO UPDATE SET
           branding = EXCLUDED.branding,
           business_hours = EXCLUDED.business_hours,
           ivr_scripts = EXCLUDED.ivr_scripts,
           workflows = EXCLUDED.workflows,
           general_config = EXCLUDED.general_config,
           customized_paths = EXCLUDED.customized_paths,
           updated_at = NOW()`,
        [
          saved.tenantId,
          JSON.stringify(saved.branding || {}),
          JSON.stringify(saved.businessHours || {}),
          JSON.stringify(saved.ivrScripts || {}),
          JSON.stringify(saved.workflows || []),
          JSON.stringify(saved.generalConfig || {}),
          saved.customizedPaths || [],
        ]
      );
    } catch { /* fallback */ }
    return saved;
  },
});
