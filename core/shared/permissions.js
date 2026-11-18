/**
 * permissions.js — Canonical Core Permission Codes & Default Role Grants.
 * Shared across Backend enforcement and Frontend UI access checks without industry-coupled SQL enums.
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

/**
 * Baseline permissions preserving 100% backward compatibility with existing seeded accounts
 * while allowing each tenant/template to define arbitrary new roles in `tenant_roles`.
 * @type {Record<string, string[]>}
 */
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
  SF_1: ['contact:read', 'contact:write', 'inbox:read', 'inbox:write', 'deal:read', 'deal:write'],
  SF_2: ['contact:read', 'contact:write', 'case:read', 'case:write', 'inbox:read', 'inbox:write'],
  SF_3: ['contact:read', 'case:read', 'credit:read', 'credit:write'],
  doctor: [
    'contact:read',
    'contact:write',
    'contact.pii:read',
    'contact.pdpa_s26:read',
    'contact.pdpa_s26:write',
    'case:read',
    'case:write',
    'appointment:read',
    'appointment:write',
  ],
  nurse: [
    'contact:read',
    'contact.pii:read',
    'contact.pdpa_s26:read',
    'contact.allergy:write',
    'case:read',
    'case:write',
    'appointment:read',
    'appointment:write',
  ],
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
