/**
 * templateValidator.js — Schema & Referential Integrity Validator for `template.yaml` files.
 * Pure platform engine: validates structure, SemVer, field types, and SLA slug references.
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';

const fieldItemSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
  label: z.string().min(1),
  type: z.enum([
    'text', 'textarea', 'number', 'currency', 'date', 'datetime',
    'boolean', 'select', 'multiselect', 'tags', 'phone', 'email', 'object_list',
  ]),
  isIndexed: z.boolean().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  validation: z
    .object({
      required: z.boolean().optional(),
      unique: z.boolean().optional(),
      regex: z.string().optional(),
      regexError: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  sensitivity: z.enum(['normal', 'pii', 'pdpa_s26']).optional(),
  acl: z
    .object({
      viewPerm: z.string().optional(),
      editPerm: z.string().optional(),
      redactMode: z.enum(['mask', 'flag_only', 'hide']).optional(),
    })
    .optional(),
  ui: z.record(z.string(), z.unknown()).optional(),
});

const templateZodSchema = z.object({
  apiVersion: z.literal('cb360.io/v1'),
  kind: z.literal('IndustryTemplate'),
  metadata: z.object({
    id: z.string().regex(/^[a-z0-9_-]{2,40}$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    industry: z.string().min(2),
    name: z.string().min(2),
    thaiTitle: z.string().min(2),
    description: z.string().optional(),
  }),
  entitlements: z.object({
    modules: z.array(z.string().regex(/^[a-z0-9-]+$/)),
    connectors: z.array(z.string().regex(/^[a-z0-9-]+$/)).optional(),
    flags: z.array(z.string().regex(/^[a-z0-9_]+$/)).optional(),
  }),
  brandingDefaults: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      logoUrl: z.string().optional(),
    })
    .optional(),
  labels: z.record(z.string(), z.record(z.string(), z.string().min(1))),
  roles: z
    .array(
      z.object({
        key: z.string().regex(/^[a-zA-Z0-9_-]{2,32}$/),
        name: z.string().min(1),
        permissions: z.array(z.string()).min(1),
      })
    )
    .optional(),
  customFields: z.object({
    contact: z.array(fieldItemSchema).optional(),
    case: z.array(fieldItemSchema).optional(),
  }),
  slaPolicies: z
    .array(
      z.object({
        slug: z.string().regex(/^[a-z0-9_]+$/),
        name: z.string().min(1),
        firstResponseMinutes: z.number().int().min(1),
        resolutionMinutes: z.number().int().min(1),
        escalationMinutesBeforeBreach: z.number().int().min(1).optional(),
      })
    )
    .min(1),
  caseCategories: z
    .array(
      z.object({
        slug: z.string().regex(/^[a-z0-9_]+$/),
        name: z.string().min(1),
        slaPolicySlug: z.string().min(1),
        defaultQueue: z.string().optional(),
        requiredFields: z.array(z.string()).optional(),
      })
    )
    .min(1),
  workflows: z.array(z.record(z.string(), z.unknown())).optional(),
  omnichannelPresets: z.record(z.string(), z.unknown()).optional(),
});

export const validateTemplateObject = (rawObj) => {
  const parsed = templateZodSchema.safeParse(rawObj);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  const tpl = parsed.data;
  const slaSlugs = new Set(tpl.slaPolicies.map((s) => s.slug));
  const refErrors = [];

  for (const cat of tpl.caseCategories) {
    if (!slaSlugs.has(cat.slaPolicySlug)) {
      refErrors.push(
        `caseCategories[${cat.slug}] references unknown slaPolicySlug "${cat.slaPolicySlug}"`
      );
    }
  }

  return { valid: refErrors.length === 0, errors: refErrors };
};

export const loadTemplateFromFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return filePath.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw);
};

export const loadBuiltInTemplate = (
  templateName,
  templatesDir = path.resolve(process.cwd(), 'templates')
) => {
  const yamlPath = path.join(templatesDir, templateName, 'template.yaml');
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`TEMPLATE_NOT_FOUND: ${templateName}`);
  }
  return loadTemplateFromFile(yamlPath);
};
