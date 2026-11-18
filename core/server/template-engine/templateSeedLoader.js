/**
 * templateSeedLoader.js — Non-destructively seeds initial contact custom fields from `seed.yaml`.
 * Never overwrites existing contact custom field values once saved by a user.
 */
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

export const loadTemplateSeedContacts = (
  templateId,
  templatesDir = path.resolve(process.cwd(), 'templates')
) => {
  if (!templateId) return [];
  const seedPath = path.join(templatesDir, String(templateId), 'seed.yaml');
  if (!fs.existsSync(seedPath)) return [];
  try {
    const parsed = parseYaml(fs.readFileSync(seedPath, 'utf8'));
    return Array.isArray(parsed?.contacts) ? parsed.contacts : [];
  } catch {
    return [];
  }
};

export const applyTemplateSeedContacts = async ({
  tenantId,
  templateId,
  customFields,
  templatesDir,
}) => {
  const contacts = loadTemplateSeedContacts(templateId, templatesDir);
  for (const c of contacts) {
    if (!c?.id || !c?.customFields) continue;
    const existing = await customFields.getEntityFields(tenantId, 'contact', String(c.id));
    if (existing && Object.keys(existing).length > 0) continue;
    await customFields.validateAndSaveEntityFields({
      tenantId,
      entityType: 'contact',
      entityId: String(c.id),
      values: c.customFields,
    });
  }
};
