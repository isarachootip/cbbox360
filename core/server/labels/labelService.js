/**
 * labelService.js — Per-tenant Terminology & Label Service (e.g. Contact -> "ผู้ป่วย" / "ผู้เอาประกัน").
 * Protects tenant-customized labels (`isCustomized = true`) from template re-apply overwrites.
 */
import { query as defaultDbQuery } from '../../../db.js';
import { DEFAULT_TENANT_ID } from '../tenancy/tenantContext.js';

export const createInMemoryLabelService = () => {
  const store = new Map(); // key: `${tenantId}::${locale}::${labelKey}`
  const makeKey = (tenantId, locale, labelKey) => `${tenantId}::${locale}::${labelKey}`;

  const getTenantLabels = async (tenantId, locale = 'th') => {
    const out = {};
    for (const item of store.values()) {
      if (item.tenantId === (tenantId || DEFAULT_TENANT_ID) && item.locale === locale) {
        out[item.labelKey] = item.labelValue;
      }
    }
    return out;
  };

  const t = async (tenantId, labelKey, fallback, locale = 'th') => {
    const rec = store.get(makeKey(tenantId || DEFAULT_TENANT_ID, locale, labelKey));
    return rec ? rec.labelValue : fallback;
  };

  const setTenantLabel = async (
    tenantId,
    locale,
    labelKey,
    labelValue,
    { origin = 'tenant', isCustomized = true } = {}
  ) => {
    const rec = {
      tenantId,
      locale: locale || 'th',
      labelKey,
      labelValue: String(labelValue),
      origin,
      isCustomized: Boolean(isCustomized),
    };
    store.set(makeKey(tenantId, rec.locale, labelKey), rec);
    return rec;
  };

  const applyTemplateLabels = async (tenantId, locale, labelDict = {}) => {
    for (const [labelKey, labelValue] of Object.entries(labelDict)) {
      const k = makeKey(tenantId, locale || 'th', labelKey);
      const existing = store.get(k);
      if (existing?.isCustomized || existing?.origin === 'tenant') continue;
      store.set(k, {
        tenantId,
        locale: locale || 'th',
        labelKey,
        labelValue: String(labelValue),
        origin: 'template',
        isCustomized: false,
      });
    }
    return getTenantLabels(tenantId, locale);
  };

  return {
    getTenantLabels,
    t,
    setTenantLabel,
    applyTemplateLabels,
  };
};

export const createPgLabelService = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryLabelService();

  const getTenantLabels = async (tenantId, locale = 'th') => {
    try {
      const r = await query(
        `SELECT label_key, label_value FROM tenant_labels WHERE tenant_id = $1 AND locale = $2`,
        [tenantId || DEFAULT_TENANT_ID, locale]
      );
      if (r?.rows?.length > 0) {
        const out = {};
        for (const row of r.rows) out[row.label_key] = row.label_value;
        return out;
      }
    } catch { /* fallback */ }
    return mem.getTenantLabels(tenantId, locale);
  };

  const setTenantLabel = async (tenantId, locale, labelKey, labelValue, opts = {}) => {
    const saved = await mem.setTenantLabel(tenantId, locale, labelKey, labelValue, opts);
    try {
      await query(
        `INSERT INTO tenant_labels (tenant_id, locale, label_key, label_value, origin, is_customized, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (tenant_id, locale, label_key) DO UPDATE SET
           label_value = EXCLUDED.label_value,
           origin = EXCLUDED.origin,
           is_customized = EXCLUDED.is_customized,
           updated_at = NOW()`,
        [tenantId, saved.locale, labelKey, saved.labelValue, saved.origin, saved.isCustomized]
      );
    } catch { /* fallback */ }
    return saved;
  };

  const applyTemplateLabels = async (tenantId, locale, labelDict = {}) => {
    const out = await mem.applyTemplateLabels(tenantId, locale, labelDict);
    const loc = locale || 'th';
    for (const [labelKey, labelValue] of Object.entries(labelDict)) {
      try {
        await query(
          `INSERT INTO tenant_labels (tenant_id, locale, label_key, label_value, origin, is_customized, updated_at)
           VALUES ($1, $2, $3, $4, 'template', FALSE, NOW())
           ON CONFLICT (tenant_id, locale, label_key) DO UPDATE SET
             label_value = EXCLUDED.label_value,
             updated_at = NOW()
           WHERE NOT tenant_labels.is_customized`,
          [tenantId, loc, labelKey, String(labelValue)]
        );
      } catch { /* fallback */ }
    }
    return out;
  };

  return {
    ...mem,
    getTenantLabels,
    setTenantLabel,
    applyTemplateLabels,
    t: async (tenantId, key, fallback, locale = 'th') => {
      const dict = await getTenantLabels(tenantId, locale);
      return dict[key] || (await mem.t(tenantId, key, fallback, locale));
    },
  };
};

export const labelService = createPgLabelService();
