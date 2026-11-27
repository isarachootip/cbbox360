/**
 * tenantUserSeedService.js — Idempotent per-tenant user provisioning from template `seed.yaml`
 * plus standard operator/agent accounts. Ensures every tenant workspace has its own isolated
 * PostgreSQL user accounts without colliding on `users.id` primary keys.
 */
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';
import { normalizeAgentSkills } from '../../shared/agentSkills.js';
import { buildTenantScopedUserId, ensureOperatorAccounts } from './userSeedService.js';

const VALID_USER_ROLES = new Set([
  'admin',
  'SF_1',
  'SF_2',
  'SF_3',
  'supervisor',
  'doctor',
  'nurse',
]);

export const loadTemplateSeedUsers = (
  templateId,
  templatesDir = path.resolve(process.cwd(), 'templates')
) => {
  if (!templateId) return [];
  const seedPath = path.join(templatesDir, String(templateId), 'seed.yaml');
  if (!fs.existsSync(seedPath)) return [];
  try {
    const parsed = parseYaml(fs.readFileSync(seedPath, 'utf8')) || {};
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return [];
  }
};

export const seedUsersForTenant = async ({
  tenantId,
  templateId,
  userRepo,
  hashPassword,
  templatesDir = path.resolve(process.cwd(), 'templates'),
  includeStandardOperators = true,
}) => {
  if (!tenantId || tenantId === DEFAULT_TENANT_ID) return [];

  const hashCache = new Map();
  const cachedHashPassword = (plain) => {
    const key = String(plain);
    if (!hashCache.has(key)) hashCache.set(key, hashPassword(key));
    return hashCache.get(key);
  };

  const created = [];
  const templateUsers = loadTemplateSeedUsers(templateId, templatesDir);

  for (const raw of templateUsers) {
    const username = String(raw?.username || '').trim();
    const role = String(raw?.role || '').trim();
    if (!username || !VALID_USER_ROLES.has(role)) continue;

    const existing = await userRepo.findByUsername(username, tenantId);
    if (existing) continue;

    const displayName = String(raw.displayName || raw.name || username).trim();
    const initials = String(raw.initials || displayName.slice(0, 2) || username.slice(0, 2)).trim();
    const baseId = String(raw.id || `usr-${username.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`);
    const passwordHash = await cachedHashPassword(String(raw.initialPassword || '1234'));

    await userRepo.insert(
      {
        id: buildTenantScopedUserId(baseId, tenantId),
        username,
        displayName,
        email: String(raw.email || ''),
        role,
        department: String(raw.department || ''),
        skills: normalizeAgentSkills(raw.skills),
        extension: String(raw.extension || ''),
        initials,
        avatarBg: String(raw.avatarBg || '#CFE2F8'),
        passwordHash,
        mustChangePassword: false,
        isActive: raw.status !== 'inactive',
      },
      tenantId
    );
    created.push({ username, action: 'inserted' });
  }

  if (includeStandardOperators) {
    const opsCreated = await ensureOperatorAccounts({
      userRepo,
      hashPassword: cachedHashPassword,
      tenantId,
    });
    created.push(...opsCreated);
  }

  return created;
};

export const ensureAllTenantsSeedUsers = async ({
  tenantRepo,
  userRepo,
  hashPassword,
  templatesDir,
}) => {
  const tenants = await tenantRepo.listTenants();
  const provisioned = [];

  for (const tenant of tenants) {
    if (!tenant?.id || tenant.id === DEFAULT_TENANT_ID || tenant.status === 'suspended') {
      continue;
    }
    const created = await seedUsersForTenant({
      tenantId: tenant.id,
      templateId: tenant.templateId,
      userRepo,
      hashPassword,
      templatesDir,
    });
    if (created.length > 0) {
      provisioned.push({
        tenantId: tenant.id,
        slug: tenant.slug,
        createdUsernames: created.map((c) => c.username),
      });
    }
  }

  return provisioned;
};
