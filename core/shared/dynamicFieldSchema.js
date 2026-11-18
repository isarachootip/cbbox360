/**
 * dynamicFieldSchema.js — Runtime Zod Schema Builder & Variable Extractor for Dynamic Custom Fields.
 * Shared between Backend API validation and Frontend form validation with zero industry hard-coding.
 */
import { z } from 'zod';

const buildSingleFieldSchema = (def) => {
  const v = def.validation || {};
  let schema;

  switch (def.type) {
    case 'number':
    case 'currency': {
      let num = z.number({ error: `${def.label} ต้องเป็นตัวเลข` });
      if (typeof v.min === 'number') num = num.min(v.min, `${def.label} ต้องไม่น้อยกว่า ${v.min}`);
      if (typeof v.max === 'number') num = num.max(v.max, `${def.label} ต้องไม่เกิน ${v.max}`);
      schema = num;
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'date':
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${def.label} ต้องอยู่ในรูปแบบ YYYY-MM-DD`);
      break;
    case 'datetime':
      schema = z.string().min(10, `${def.label} ไม่ถูกต้อง`);
      break;
    case 'select': {
      const allowed = (def.options || []).map((o) => o.value);
      schema =
        allowed.length > 0
          ? z.string().refine((val) => allowed.includes(val), {
              message: `${def.label} ต้องเป็นหนึ่งในค่าที่กำหนด`,
            })
          : z.string();
      break;
    }
    case 'multiselect':
    case 'tags':
      schema = z.array(z.string().trim().min(1));
      break;
    case 'object_list':
      schema = z.array(z.record(z.string(), z.unknown()));
      break;
    default: {
      let str = z.string().trim();
      if (v.required) {
        str = str.min(1, `กรุณาระบุ ${def.label}`);
      }
      if (v.regex) {
        const re = new RegExp(v.regex);
        str = str.refine((val) => !val || re.test(val), {
          message: v.regexError || `รูปแบบของ ${def.label} ไม่ถูกต้อง`,
        });
      }
      schema = str;
    }
  }

  if (!v.required) {
    return schema.optional();
  }
  return schema;
};

/**
 * Builds a Zod object validator dynamically from active `FieldDefinition[]`.
 * Unknown fields are stripped so arbitrary unvalidated keys cannot pollute JSONB storage.
 */
export const buildDynamicZodSchema = (defs = []) => {
  const shape = {};
  for (const def of defs) {
    if (def.isActive === false) continue;
    shape[def.key] = buildSingleFieldSchema(def);
  }
  return z.object(shape);
};

/**
 * Extracts template placeholder variables (e.g. `{hn_number}`) configured via `ui.variableKey`.
 * Replaces hard-coded `switch (profile.kind)` in legacy `industryVariables.ts`.
 */
export const extractCustomFieldTemplateVariables = (defs = [], values = {}) => {
  const vars = {};
  if (!values || typeof values !== 'object') return vars;

  for (const def of defs) {
    const varKey = def.ui?.variableKey;
    if (!varKey) continue;
    const rawVal = values[def.key];
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;
    vars[varKey] = Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal);
  }
  return vars;
};
