/**
 * customFieldService.js — Manages `field_definitions`, validates entity JSONB custom fields,
 * enforces per-tenant uniqueness, and maintains `custom_field_index` for fast text/number/date queries.
 */
import { buildDynamicZodSchema } from '../../shared/dynamicFieldSchema.js';

const normalizeIndexRecord = (def, rawVal) => {
  if (rawVal === undefined || rawVal === null || rawVal === '') return null;
  if (def.type === 'number' || def.type === 'currency') {
    const n = Number(rawVal);
    return Number.isFinite(n) ? { valueText: String(n), valueNum: n, valueDate: null } : null;
  }
  if (def.type === 'date') {
    const d = String(rawVal).trim();
    return { valueText: d.toLowerCase(), valueNum: null, valueDate: d };
  }
  const text = Array.isArray(rawVal) ? rawVal.join(' ').toLowerCase() : String(rawVal).trim().toLowerCase();
  return { valueText: text, valueNum: null, valueDate: null };
};

export function createInMemoryCustomFieldService() {
  const defsStore = new Map(); // key: `${tenantId}::${entityType}::${fieldKey}`
  const valuesStore = new Map(); // key: `${tenantId}::${entityType}::${entityId}`
  const indexStore = new Map(); // key: `${tenantId}::${entityType}::${entityId}::${fieldKey}`

  const defMapKey = (tenantId, entityType, fieldKey) => `${tenantId}::${entityType}::${fieldKey}`;
  const valMapKey = (tenantId, entityType, entityId) => `${tenantId}::${entityType}::${entityId}`;
  const idxMapKey = (tenantId, entityType, entityId, fieldKey) =>
    `${tenantId}::${entityType}::${entityId}::${fieldKey}`;

  const listFieldDefs = async (tenantId, entityType) => {
    const list = [];
    for (const def of defsStore.values()) {
      if (def.tenantId === tenantId && def.entityType === entityType && def.isActive !== false) {
        list.push(def);
      }
    }
    return list.sort((a, b) => (a.ui?.order ?? 99) - (b.ui?.order ?? 99));
  };

  const upsertFieldDef = async (tenantId, def, { origin = 'tenant', isCustomized = true } = {}) => {
    const k = defMapKey(tenantId, def.entityType, def.key);
    const existing = defsStore.get(k);
    if (origin === 'template' && (existing?.isCustomized || existing?.origin === 'tenant')) {
      return existing;
    }
    const saved = {
      ...def,
      id: def.id || `fd_${tenantId}_${def.entityType}_${def.key}`,
      tenantId,
      origin,
      isCustomized: Boolean(isCustomized),
      isActive: def.isActive !== false,
    };
    defsStore.set(k, saved);
    return saved;
  };

  const applyTemplateFieldDefs = async (tenantId, defs = []) => {
    for (const def of defs) {
      await upsertFieldDef(tenantId, def, { origin: 'template', isCustomized: false });
    }
    return true;
  };

  const getEntityFields = async (tenantId, entityType, entityId) =>
    valuesStore.get(valMapKey(tenantId, entityType, entityId)) || {};

  const validateAndSaveEntityFields = async ({ tenantId, entityType, entityId, values }) => {
    const defs = await listFieldDefs(tenantId, entityType);
    const schema = buildDynamicZodSchema(defs);
    const parsed = schema.safeParse(values || {});
    if (!parsed.success) {
      return {
        ok: false,
        code: 'INVALID_CUSTOM_FIELDS',
        errors: parsed.error.issues.map((i) => ({
          path: i.path.map(String).join('.'),
          message: i.message,
        })),
      };
    }

    const cleanValues = parsed.data;

    // Enforce per-tenant `unique: true` across `custom_field_index`
    for (const def of defs) {
      if (!def.validation?.unique) continue;
      const norm = normalizeIndexRecord(def, cleanValues[def.key]);
      if (!norm) continue;

      for (const idx of indexStore.values()) {
        if (
          idx.tenantId === tenantId &&
          idx.entityType === entityType &&
          idx.fieldKey === def.key &&
          idx.valueText === norm.valueText &&
          idx.entityId !== entityId
        ) {
          return {
            ok: false,
            code: 'DUPLICATE_CUSTOM_FIELD',
            errors: [{ path: def.key, message: `${def.label} ซ้ำกับข้อมูลที่มีอยู่แล้วในระบบ` }],
          };
        }
      }
    }

    valuesStore.set(valMapKey(tenantId, entityType, entityId), cleanValues);

    // Sync `custom_field_index` for indexed or unique fields
    for (const def of defs) {
      const ik = idxMapKey(tenantId, entityType, entityId, def.key);
      if (!def.isIndexed && !def.validation?.unique) {
        indexStore.delete(ik);
        continue;
      }
      const norm = normalizeIndexRecord(def, cleanValues[def.key]);
      if (!norm) {
        indexStore.delete(ik);
      } else {
        indexStore.set(ik, {
          tenantId,
          entityType,
          entityId,
          fieldKey: def.key,
          ...norm,
        });
      }
    }

    return { ok: true, values: cleanValues };
  };

  const searchEntitiesByDateRange = async ({ tenantId, entityType, fieldKey, fromDate, toDate }) => {
    const matches = [];
    for (const idx of indexStore.values()) {
      if (
        idx.tenantId === tenantId &&
        idx.entityType === entityType &&
        idx.fieldKey === fieldKey &&
        idx.valueDate &&
        idx.valueDate >= fromDate &&
        idx.valueDate <= toDate
      ) {
        matches.push(idx.entityId);
      }
    }
    return matches;
  };

  return {
    listFieldDefs,
    upsertFieldDef,
    applyTemplateFieldDefs,
    getEntityFields,
    validateAndSaveEntityFields,
    searchEntitiesByDateRange,
  };
};

export { createPgCustomFieldService } from './pgCustomFieldService.js';
import { createPgCustomFieldService as makePgCustomFieldService } from './pgCustomFieldService.js';

export const customFieldService = makePgCustomFieldService();
