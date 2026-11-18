/**
 * pgCustomFieldService.js — PostgreSQL persistence wrapper for `field_definitions`,
 * `entity_custom_fields`, entity `custom_fields` JSONB (`customers`, `cases`), and `custom_field_index`.
 */
import { query as defaultDbQuery } from '../../../db.js';
import { createInMemoryCustomFieldService } from './customFieldService.js';

const rowToFieldDef = (r) => ({
  id: r.id,
  tenantId: r.tenant_id,
  entityType: r.entity_type,
  key: r.field_key,
  label: r.label,
  type: r.field_type,
  options: Array.isArray(r.options_json) ? r.options_json : [],
  validation: r.validation_json || {},
  sensitivity: r.sensitivity || 'normal',
  acl: r.acl_json || {},
  ui: r.ui_json || {},
  isIndexed: Boolean(r.is_indexed),
  isActive: r.is_active !== false,
  origin: r.origin || 'template',
  isCustomized: Boolean(r.is_customized),
});

export const createPgCustomFieldService = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryCustomFieldService();

  const listFieldDefs = async (tenantId, entityType) => {
    try {
      const r = await query(
        `SELECT * FROM field_definitions WHERE tenant_id = $1 AND entity_type = $2 AND is_active = TRUE`,
        [tenantId, entityType]
      );
      if (r?.rows?.length > 0) {
        return r.rows.map(rowToFieldDef).sort((a, b) => (a.ui?.order ?? 99) - (b.ui?.order ?? 99));
      }
    } catch { /* fallback */ }
    return mem.listFieldDefs(tenantId, entityType);
  };

  const upsertFieldDef = async (tenantId, def, opts = { origin: 'tenant', isCustomized: true }) => {
    const saved = await mem.upsertFieldDef(tenantId, def, opts);
    try {
      await query(
        `INSERT INTO field_definitions (
           id, tenant_id, entity_type, field_key, label, field_type,
           options_json, validation_json, sensitivity, acl_json, ui_json,
           is_indexed, is_active, origin, is_customized, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15,NOW())
         ON CONFLICT (tenant_id, entity_type, field_key) DO UPDATE SET
           label = EXCLUDED.label, field_type = EXCLUDED.field_type, options_json = EXCLUDED.options_json,
           validation_json = EXCLUDED.validation_json, sensitivity = EXCLUDED.sensitivity,
           acl_json = EXCLUDED.acl_json, ui_json = EXCLUDED.ui_json, is_indexed = EXCLUDED.is_indexed
         WHERE NOT field_definitions.is_customized OR EXCLUDED.is_customized`,
        [
          saved.id, tenantId, saved.entityType, saved.key, saved.label, saved.type,
          JSON.stringify(saved.options || []), JSON.stringify(saved.validation || {}),
          saved.sensitivity || 'normal', JSON.stringify(saved.acl || {}), JSON.stringify(saved.ui || {}),
          Boolean(saved.isIndexed), saved.isActive !== false, saved.origin, saved.isCustomized,
        ]
      );
    } catch { /* fallback */ }
    return saved;
  };

  const applyTemplateFieldDefs = async (tenantId, defs = []) => {
    for (const def of defs) await upsertFieldDef(tenantId, def, { origin: 'template', isCustomized: false });
    return true;
  };

  const getEntityFields = async (tenantId, entityType, entityId) => {
    try {
      const r = await query(
        `SELECT values_json FROM entity_custom_fields WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3 LIMIT 1`,
        [tenantId, entityType, entityId]
      );
      if (r?.rows?.[0]?.values_json) return r.rows[0].values_json;
    } catch { /* fallback */ }

    const table = entityType === 'contact' ? 'customers' : entityType === 'case' ? 'cases' : null;
    if (table) {
      try {
        const r = await query(`SELECT custom_fields FROM ${table} WHERE tenant_id = $1 AND id = $2 LIMIT 1`, [tenantId, entityId]);
        if (r?.rows?.[0]?.custom_fields) return r.rows[0].custom_fields;
      } catch { /* fallback */ }
    }
    return mem.getEntityFields(tenantId, entityType, entityId);
  };

  const validateAndSaveEntityFields = async ({ tenantId, entityType, entityId, values }) => {
    const defs = await listFieldDefs(tenantId, entityType);
    for (const d of defs) await mem.upsertFieldDef(tenantId, d, { origin: d.origin, isCustomized: d.isCustomized });

    for (const def of defs) {
      if (!def.validation?.unique || !values?.[def.key]) continue;
      const normText = String(values[def.key]).trim().toLowerCase();
      try {
        const dup = await query(
          `SELECT entity_id FROM custom_field_index
           WHERE tenant_id = $1 AND entity_type = $2 AND field_key = $3 AND value_text = $4 AND entity_id <> $5 LIMIT 1`,
          [tenantId, entityType, def.key, normText, entityId]
        );
        if (dup?.rows?.length > 0) {
          return {
            ok: false,
            code: 'DUPLICATE_CUSTOM_FIELD',
            errors: [{ path: def.key, message: `${def.label} ซ้ำกับข้อมูลที่มีอยู่แล้วในระบบ` }],
          };
        }
      } catch { /* fallback to mem uniqueness check */ }
    }

    const res = await mem.validateAndSaveEntityFields({ tenantId, entityType, entityId, values });
    if (!res.ok) return res;

    try {
      await query(
        `INSERT INTO entity_custom_fields (tenant_id, entity_type, entity_id, values_json, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW())
         ON CONFLICT (tenant_id, entity_type, entity_id) DO UPDATE SET values_json = EXCLUDED.values_json, updated_at = NOW()`,
        [tenantId, entityType, entityId, JSON.stringify(res.values)]
      );
      for (const def of defs) {
        if (!def.isIndexed && !def.validation?.unique) continue;
        const raw = res.values[def.key];
        const norm = raw === undefined || raw === null || raw === '' ? null : String(raw).trim().toLowerCase();
        if (norm) {
          await query(
            `INSERT INTO custom_field_index (tenant_id, entity_type, entity_id, field_key, value_text)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (tenant_id, entity_type, entity_id, field_key) DO UPDATE SET value_text = EXCLUDED.value_text`,
            [tenantId, entityType, entityId, def.key, norm]
          );
        }
      }
    } catch { /* fallback */ }

    const table = entityType === 'contact' ? 'customers' : entityType === 'case' ? 'cases' : null;
    if (table) {
      try {
        await query(`UPDATE ${table} SET custom_fields = $1::jsonb WHERE tenant_id = $2 AND id = $3`, [JSON.stringify(res.values), tenantId, entityId]);
      } catch { /* fallback */ }
    }
    return res;
  };

  return { ...mem, listFieldDefs, upsertFieldDef, applyTemplateFieldDefs, getEntityFields, validateAndSaveEntityFields };
};
