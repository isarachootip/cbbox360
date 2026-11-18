/**
 * permissions.js — Canonical Core Permission Codes & Extensible Role Grants.
 * Pure platform core: contains zero industry-specific role names. Modules and templates
 * register domain roles (e.g. via `registerDefaultRolePreset` or `tenant_roles` DB rows).
 */

export const CORE_PERMISSIONS = {
  WILDCARD: '*',
  CONTACT_READ: 'contact:read',
  CONTACT_WRITE: 'contact:write',
  CONTACT_PII_READ: 'contact.pii:read',
  CONTACT_SENSITIVE_READ: 'contact.pdpa_s26:read',
  CONTACT_SENSITIVE_WRITE: 'contact.pdpa_s26:write',
  CASE_READ: 'case:read',
  CASE_WRITE: 'case:write',
  INBOX_READ: 'inbox:read',
  INBOX_WRITE: 'inbox:write',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_USERS: 'admin:users',
  ADMIN_TEMPLATES: 'admin:templates',
};

/** @type {Record<string, string[]>} */
export const DEFAULT_ROLE_PERMISSIONS = {
  sysadmin: ['*'],
  admin: [
    'contact:read',
    'contact:write',
    'contact.pii:read',
    'contact.pdpa_s26:read',
    'contact.pdpa_s26:write',
    'case:read',
    'case:write',
    'inbox:read',
    'inbox:write',
    'admin:settings',
    'admin:users',
    'admin:templates',
  ],
  supervisor: [
    'contact:read',
    'contact:write',
    'contact.pii:read',
    'case:read',
    'case:write',
    'inbox:read',
    'inbox:write',
  ],
  agent: ['contact:read', 'contact:write', 'case:read', 'case:write', 'inbox:read', 'inbox:write'],
  SF_1: ['contact:read', 'contact:write', 'inbox:read', 'inbox:write', 'deal:read', 'deal:write'],
  SF_2: ['contact:read', 'contact:write', 'case:read', 'case:write', 'inbox:read', 'inbox:write'],
  SF_3: ['contact:read', 'case:read'],
};

/**
 * Allows pluggable modules to register baseline role permission presets without polluting Core.
 * @param {string} roleKey
 * @param {string[]} permissions
 */
export const registerDefaultRolePreset = (roleKey, permissions) => {
  const prev = DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
  DEFAULT_ROLE_PERMISSIONS[roleKey] = Array.from(new Set([...prev, ...permissions]));
};

/**
 * Evaluates whether a granted permission array satisfies a required permission code.
 * @param {string[]} granted
 * @param {string} required
 * @returns {boolean}
 */
export const matchPermission = (granted, required) => {
  if (!Array.isArray(granted) || !required) return false;
  if (granted.includes('*') || granted.includes(required)) return true;
  const [namespace] = String(required).split(':');
  return Boolean(namespace && granted.includes(`${namespace}:*`));
};
