/**
 * entitlementService.js — Runtime Feature Flag & Module Entitlement Guard per Tenant.
 * Enforces entitlements at API boundaries and preserves tenant-customized flags across template updates.
 */
import { query as defaultDbQuery } from '../../../db.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../tenancy/tenantContext.js';

export const DEFAULT_TENANT_ENTITLEMENTS = {
  'flag:ai_copilot': true,
  'flag:voice_3cx': true,
  'flag:pdpa_consent': true,
};

export const registerDefaultTenantEntitlement = (featureKey, enabled = true) => {
  DEFAULT_TENANT_ENTITLEMENTS[featureKey] = Boolean(enabled);
};

export const createInMemoryEntitlementService = () => {
  const store = new Map();
  const makeKey = (tenantId, featureKey) => `${tenantId}::${featureKey}`;

  // Seed backward-compatible entitlements for 'default' tenant
  for (const [fk, enabled] of Object.entries(DEFAULT_TENANT_ENTITLEMENTS)) {
    store.set(makeKey(DEFAULT_TENANT_ID, fk), {
      tenantId: DEFAULT_TENANT_ID,
      featureKey: fk,
      enabled,
      limits: {},
      origin: 'template',
      isCustomized: false,
    });
  }

  const getEntitlementMap = async (tenantId) => {
    const map = {};
    for (const entry of store.values()) {
      if (entry.tenantId === tenantId) {
        map[entry.featureKey] = Boolean(entry.enabled);
      }
    }
    return map;
  };

  const isEnabled = async (tenantId, featureKey) => {
    const entry = store.get(makeKey(tenantId || DEFAULT_TENANT_ID, featureKey));
    return Boolean(entry?.enabled);
  };

  const setEntitlement = async (
    tenantId,
    featureKey,
    enabled,
    { limits = {}, origin = 'tenant_admin', isCustomized = true } = {}
  ) => {
    const record = {
      tenantId,
      featureKey,
      enabled: Boolean(enabled),
      limits,
      origin,
      isCustomized: Boolean(isCustomized),
    };
    store.set(makeKey(tenantId, featureKey), record);
    return record;
  };

  const applyTemplateEntitlements = async (tenantId, entitlementMap) => {
    for (const [featureKey, enabled] of Object.entries(entitlementMap || {})) {
      const existing = store.get(makeKey(tenantId, featureKey));
      if (existing?.isCustomized || existing?.origin === 'tenant_admin' || existing?.origin === 'license') {
        continue;
      }
      store.set(makeKey(tenantId, featureKey), {
        tenantId,
        featureKey,
        enabled: Boolean(enabled),
        limits: existing?.limits || {},
        origin: 'template',
        isCustomized: false,
      });
    }
    return getEntitlementMap(tenantId);
  };

  const requireEntitlement = (featureKey) => async (_req, res, next) => {
    const tenantId = getCurrentTenantId();
    if (!(await isEnabled(tenantId, featureKey))) {
      return res.status(403).json({
        success: false,
        error: 'FEATURE_NOT_ENTITLED',
        featureKey,
        tenantId,
      });
    }
    return next();
  };

  return {
    isEnabled,
    getEntitlementMap,
    setEntitlement,
    applyTemplateEntitlements,
    requireEntitlement,
  };
};

export const createPgEntitlementService = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryEntitlementService();

  const getEntitlementMap = async (tenantId) => {
    try {
      const r = await query(
        `SELECT feature_key, enabled FROM tenant_entitlements WHERE tenant_id = $1`,
        [tenantId]
      );
      if (r?.rows?.length > 0) {
        const out = {};
        for (const row of r.rows) out[row.feature_key] = Boolean(row.enabled);
        return out;
      }
    } catch { /* fallback to mem */ }
    return mem.getEntitlementMap(tenantId);
  };

  const isEnabled = async (tenantId, featureKey) => {
    const map = await getEntitlementMap(tenantId || DEFAULT_TENANT_ID);
    return Boolean(map[featureKey]);
  };

  const setEntitlement = async (tenantId, featureKey, enabled, opts = {}) => {
    const saved = await mem.setEntitlement(tenantId, featureKey, enabled, opts);
    try {
      await query(
        `INSERT INTO tenant_entitlements (tenant_id, feature_key, enabled, limits_json, origin, is_customized, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW())
         ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
           enabled = EXCLUDED.enabled,
           limits_json = EXCLUDED.limits_json,
           origin = EXCLUDED.origin,
           is_customized = EXCLUDED.is_customized,
           updated_at = NOW()`,
        [tenantId, featureKey, saved.enabled, JSON.stringify(saved.limits), saved.origin, saved.isCustomized]
      );
    } catch { /* fallback */ }
    return saved;
  };

  const requireEntitlement = (featureKey) => async (_req, res, next) => {
    const tenantId = getCurrentTenantId();
    if (!(await isEnabled(tenantId, featureKey))) {
      return res.status(403).json({
        success: false,
        error: 'FEATURE_NOT_ENTITLED',
        featureKey,
        tenantId,
      });
    }
    return next();
  };

  return {
    isEnabled,
    getEntitlementMap,
    setEntitlement,
    applyTemplateEntitlements: mem.applyTemplateEntitlements,
    requireEntitlement,
  };
};

export const entitlementService = createPgEntitlementService();
