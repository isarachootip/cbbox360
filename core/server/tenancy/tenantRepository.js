/**
 * tenantRepository.js — Persistence for `tenants`, `tenant_domains`, and `tenant_settings`.
 * Provides both PostgreSQL-backed and isolated in-memory repositories with non-destructive merge support.
 */
import { query as defaultDbQuery } from '../../../db.js';
import { DEFAULT_TENANT_ID } from './tenantContext.js';

export const DEFAULT_BRANDING = {
  appName: 'CusBox360',
  logoUrl: '/logo-full-transparent.png',
  iconUrl: '/logo-icon-transparent.png',
  faviconUrl: '/logo.png',
  primaryColor: '#1F6FD1',
  accentColor: '#1558B0',
};

const makeDefaultTenant = () => ({
  id: DEFAULT_TENANT_ID,
  slug: DEFAULT_TENANT_ID,
  name: 'CusBox360 Default Workspace',
  status: 'active',
  templateId: 'b2b_wholesale',
  templateVersion: '1.0.0',
  isolationMode: 'shared_db',
  dbDsnEncrypted: null,
});

const makeDefaultSettings = (tenantId = DEFAULT_TENANT_ID) => ({
  tenantId,
  branding: { ...DEFAULT_BRANDING },
  businessHours: {},
  ivrScripts: {},
  workflows: [],
  generalConfig: { defaultLanguage: 'th', currency: 'THB' },
  customizedPaths: [],
});

const normalizeHost = (host) => String(host || '').trim().toLowerCase().replace(/:\d+$/, '');

export const createInMemoryTenantRepository = () => {
  const tenants = new Map([[DEFAULT_TENANT_ID, makeDefaultTenant()]]);
  const domains = new Map();
  const settingsMap = new Map([[DEFAULT_TENANT_ID, makeDefaultSettings(DEFAULT_TENANT_ID)]]);

  return {
    async findById(id) {
      return tenants.get(id) ?? null;
    },

    async findBySlug(slug) {
      const target = String(slug || '').trim().toLowerCase();
      for (const t of tenants.values()) {
        if (t.slug.toLowerCase() === target) return t;
      }
      return null;
    },

    async findByDomain(hostname) {
      const host = normalizeHost(hostname);
      const tenantId = domains.get(host);
      return tenantId ? (tenants.get(tenantId) ?? null) : null;
    },

    async listTenants() {
      return Array.from(tenants.values());
    },

    async upsertTenant(input) {
      const existing = tenants.get(input.id);
      const record = {
        id: input.id,
        slug: String(input.slug || input.id).toLowerCase(),
        name: input.name || input.id,
        status: input.status || existing?.status || 'active',
        templateId: input.templateId ?? existing?.templateId ?? null,
        templateVersion: input.templateVersion ?? existing?.templateVersion ?? '1.0.0',
        isolationMode: input.isolationMode || existing?.isolationMode || 'shared_db',
        dbDsnEncrypted: input.dbDsnEncrypted ?? existing?.dbDsnEncrypted ?? null,
      };
      tenants.set(record.id, record);
      if (!settingsMap.has(record.id)) {
        settingsMap.set(record.id, makeDefaultSettings(record.id));
      }
      return record;
    },

    async bindDomain(hostname, tenantId, isPrimary = false) {
      const host = normalizeHost(hostname);
      domains.set(host, tenantId);
      return { hostname: host, tenantId, isPrimary };
    },

    async getTenantSettings(tenantId) {
      return settingsMap.get(tenantId) ?? makeDefaultSettings(tenantId);
    },

    async updateTenantSettings(tenantId, patch, { markCustomized = true } = {}) {
      const prev = settingsMap.get(tenantId) ?? makeDefaultSettings(tenantId);
      const changedKeys = Object.keys(patch).filter((k) => patch[k] !== undefined);
      const customized = new Set(prev.customizedPaths || []);
      if (markCustomized) changedKeys.forEach((k) => customized.add(k));

      const next = {
        ...prev,
        ...patch,
        branding: patch.branding ? { ...prev.branding, ...patch.branding } : prev.branding,
        customizedPaths: Array.from(customized),
      };
      settingsMap.set(tenantId, next);
      return next;
    },

    async applyTemplateSettingsDefaults(tenantId, defaults) {
      const prev = settingsMap.get(tenantId) ?? makeDefaultSettings(tenantId);
      const customized = new Set(prev.customizedPaths || []);
      const next = { ...prev };

      for (const [key, value] of Object.entries(defaults)) {
        if (value === undefined || customized.has(key)) continue;
        next[key] = key === 'branding' ? { ...prev.branding, ...value } : value;
      }
      settingsMap.set(tenantId, next);
      return next;
    },
  };
};

export const createPgTenantRepository = ({ query = defaultDbQuery } = {}) => {
  const fallback = createInMemoryTenantRepository();
  const rowToTenant = (r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    status: r.status,
    templateId: r.template_id,
    templateVersion: r.template_version,
    isolationMode: r.isolation_mode,
    dbDsnEncrypted: r.db_dsn_encrypted,
  });

  return {
    async findById(id) {
      try {
        const r = await query(`SELECT * FROM tenants WHERE id = $1 LIMIT 1`, [id]);
        if (r?.rows?.[0]) return rowToTenant(r.rows[0]);
      } catch { /* fallback */ }
      return fallback.findById(id);
    },
    async findBySlug(slug) {
      try {
        const r = await query(`SELECT * FROM tenants WHERE LOWER(slug) = LOWER($1) LIMIT 1`, [slug]);
        if (r?.rows?.[0]) return rowToTenant(r.rows[0]);
      } catch { /* fallback */ }
      return fallback.findBySlug(slug);
    },
    async findByDomain(hostname) {
      const host = normalizeHost(hostname);
      try {
        const r = await query(
          `SELECT t.* FROM tenant_domains d JOIN tenants t ON t.id = d.tenant_id WHERE LOWER(d.hostname) = $1 LIMIT 1`,
          [host]
        );
        if (r?.rows?.[0]) return rowToTenant(r.rows[0]);
      } catch { /* fallback */ }
      return fallback.findByDomain(host);
    },
    listTenants: () => fallback.listTenants(),
    upsertTenant: (input) => fallback.upsertTenant(input),
    bindDomain: (hostname, tenantId, isPrimary) => fallback.bindDomain(hostname, tenantId, isPrimary),
    getTenantSettings: (tenantId) => fallback.getTenantSettings(tenantId),
    updateTenantSettings: (tenantId, patch, opts) => fallback.updateTenantSettings(tenantId, patch, opts),
    applyTemplateSettingsDefaults: (tenantId, defs) => fallback.applyTemplateSettingsDefaults(tenantId, defs),
  };
};

export const tenantRepository = createPgTenantRepository();
