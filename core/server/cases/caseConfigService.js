/**
 * caseConfigService.js — Tenant-scoped Case Categories & SLA Policies service.
 * Supports non-destructive template seeding (`isCustomized` records are never overwritten).
 */

export const createInMemoryCaseConfigService = () => {
  const slas = new Map(); // key: `${tenantId}::${slug}`
  const categories = new Map(); // key: `${tenantId}::${slug}`
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

  const upsertSlaPolicy = async (
    tenantId,
    policy,
    { origin = 'tenant', isCustomized = true } = {}
  ) => {
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
      slaPolicySlug: cat.slaPolicySlug,
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

  return {
    listSlaPolicies,
    listCategories,
    upsertSlaPolicy,
    upsertCategory,
    applyTemplateCaseConfigs,
  };
};

export const caseConfigService = createInMemoryCaseConfigService();
