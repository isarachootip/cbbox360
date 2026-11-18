/**
 * caseConfigService.js — Tenant-scoped Case Categories & SLA Policies service.
 * Supports PostgreSQL persistence and non-destructive template seeding (`isCustomized` preserved).
 */
import { query as defaultDbQuery } from '../../../db.js';

export const createInMemoryCaseConfigService = () => {
  const slas = new Map();
  const categories = new Map();
  const makeKey = (tenantId, slug) => `${tenantId}::${slug}`;

  const listSlaPolicies = async (tenantId) => {
    const out = [];
    for (const s of slas.values()) {
      if (s.tenantId === tenantId) out.push(s);
    }
    return out;
  };

  const listCategories = async (tenantId) => {
    const out = [];
    for (const c of categories.values()) {
      if (c.tenantId === tenantId && c.isActive !== false) out.push(c);
    }
    return out.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  };

  const upsertSlaPolicy = async (tenantId, policy, { origin = 'tenant', isCustomized = true } = {}) => {
    const k = makeKey(tenantId, policy.slug);
    const existing = slas.get(k);
    if (origin === 'template' && (existing?.isCustomized || existing?.origin === 'tenant')) {
      return existing;
    }
    const saved = {
      id: policy.id || `sla_${tenantId}_${policy.slug}`,
      tenantId,
      slug: policy.slug,
      name: policy.name,
      firstResponseMinutes: Number(policy.firstResponseMinutes),
      resolutionMinutes: Number(policy.resolutionMinutes),
      escalationMinutesBeforeBreach: policy.escalationMinutesBeforeBreach,
      origin,
      isCustomized: Boolean(isCustomized),
    };
    slas.set(k, saved);
    return saved;
  };

  const upsertCategory = async (
    tenantId,
    cat,
    { sortOrder = 1, origin = 'tenant', isCustomized = true } = {}
  ) => {
    const k = makeKey(tenantId, cat.slug);
    const existing = categories.get(k);
    if (origin === 'template' && (existing?.isCustomized || existing?.origin === 'tenant')) {
      return existing;
    }
    const saved = {
      id: cat.id || `cat_${tenantId}_${cat.slug}`,
      tenantId,
      slug: cat.slug,
      name: cat.name,
      slaPolicySlug: cat.slaPolicySlug || null,
      defaultQueue: cat.defaultQueue || 'General',
      requiredFields: cat.requiredFields || [],
      sortOrder: cat.sortOrder ?? sortOrder,
      isActive: cat.isActive !== false,
      origin,
      isCustomized: Boolean(isCustomized),
    };
    categories.set(k, saved);
    return saved;
  };

  const applyTemplateCaseConfigs = async (tenantId, { slaPolicies = [], caseCategories = [] }) => {
    for (const sla of slaPolicies) {
      await upsertSlaPolicy(tenantId, sla, { origin: 'template', isCustomized: false });
    }
    for (let i = 0; i < caseCategories.length; i += 1) {
      await upsertCategory(tenantId, caseCategories[i], {
        sortOrder: i + 1,
        origin: 'template',
        isCustomized: false,
      });
    }
    return {
      slaPolicies: await listSlaPolicies(tenantId),
      caseCategories: await listCategories(tenantId),
    };
  };

  return { listSlaPolicies, listCategories, upsertSlaPolicy, upsertCategory, applyTemplateCaseConfigs };
};

export const createPgCaseConfigService = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryCaseConfigService();

  const listCategories = async (tenantId) => {
    try {
      const r = await query(
        `SELECT * FROM case_categories WHERE tenant_id = $1 AND is_active = TRUE ORDER BY sort_order ASC`,
        [tenantId]
      );
      if (r?.rows?.length > 0) {
        return r.rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          slug: row.slug,
          name: row.name,
          slaPolicySlug: row.sla_policy_slug,
          defaultQueue: row.default_queue || 'General',
          requiredFields: Array.isArray(row.required_fields) ? row.required_fields : [],
          sortOrder: row.sort_order,
          isActive: row.is_active,
          origin: row.origin,
          isCustomized: row.is_customized,
        }));
      }
    } catch { /* fallback */ }
    return mem.listCategories(tenantId);
  };

  const upsertSlaPolicy = async (tenantId, policy, opts = {}) => {
    const saved = await mem.upsertSlaPolicy(tenantId, policy, opts);
    try {
      await query(
        `INSERT INTO sla_policies (id, tenant_id, slug, name, first_response_minutes, resolution_minutes, escalation_json, origin, is_customized)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
         ON CONFLICT (tenant_id, slug) DO UPDATE SET
           name = EXCLUDED.name,
           first_response_minutes = EXCLUDED.first_response_minutes,
           resolution_minutes = EXCLUDED.resolution_minutes
         WHERE NOT sla_policies.is_customized OR EXCLUDED.is_customized`,
        [
          saved.id,
          tenantId,
          saved.slug,
          saved.name,
          saved.firstResponseMinutes,
          saved.resolutionMinutes,
          JSON.stringify({ escalationMinutesBeforeBreach: saved.escalationMinutesBeforeBreach }),
          saved.origin,
          saved.isCustomized,
        ]
      );
    } catch { /* fallback */ }
    return saved;
  };

  const upsertCategory = async (tenantId, cat, opts = {}) => {
    const saved = await mem.upsertCategory(tenantId, cat, opts);
    try {
      await query(
        `INSERT INTO case_categories (id, tenant_id, slug, name, sla_policy_slug, default_queue, required_fields, sort_order, is_active, origin, is_customized)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
         ON CONFLICT (tenant_id, slug) DO UPDATE SET
           name = EXCLUDED.name, sla_policy_slug = EXCLUDED.sla_policy_slug,
           default_queue = EXCLUDED.default_queue, required_fields = EXCLUDED.required_fields, sort_order = EXCLUDED.sort_order
         WHERE NOT case_categories.is_customized OR EXCLUDED.is_customized`,
        [
          saved.id, tenantId, saved.slug, saved.name, saved.slaPolicySlug, saved.defaultQueue,
          JSON.stringify(saved.requiredFields), saved.sortOrder, saved.isActive, saved.origin, saved.isCustomized,
        ]
      );
    } catch { /* fallback */ }
    return saved;
  };

  const applyTemplateCaseConfigs = async (tenantId, { slaPolicies = [], caseCategories = [] }) => {
    for (const sla of slaPolicies) await upsertSlaPolicy(tenantId, sla, { origin: 'template', isCustomized: false });
    for (let i = 0; i < caseCategories.length; i += 1) {
      await upsertCategory(tenantId, caseCategories[i], { sortOrder: i + 1, origin: 'template', isCustomized: false });
    }
    return { slaPolicies: await mem.listSlaPolicies(tenantId), caseCategories: await listCategories(tenantId) };
  };

  return { ...mem, listCategories, upsertSlaPolicy, upsertCategory, applyTemplateCaseConfigs };
};

export const caseConfigService = createPgCaseConfigService();
