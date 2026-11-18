/**
 * permissionService.js — Tenant-scoped Permission RBAC Service & Middleware.
 * Replaces rigid SQL role enums so templates can seed domain roles (doctor, underwriter, claim_adjuster)
 * while Core checks granular permission codes (`claim:approve`, `contact.pdpa_s26:read`).
 */
import { query as defaultDbQuery } from '../../../db.js';
import { DEFAULT_ROLE_PERMISSIONS, matchPermission } from '../../shared/permissions.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../tenancy/tenantContext.js';

export const createInMemoryPermissionService = () => {
  const customRoles = new Map();
  const makeKey = (tenantId, roleKey) => `${tenantId}::${roleKey}`;

  const getRolePermissions = async (tenantId, roleKey) => {
    if (!roleKey) return [];
    const custom = customRoles.get(makeKey(tenantId || DEFAULT_TENANT_ID, roleKey));
    if (custom) return custom.permissions;
    return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
  };

  const upsertRole = async (
    tenantId,
    { roleKey, name, permissions = [], isSystem = false, origin = 'template', isCustomized = false }
  ) => {
    const existing = customRoles.get(makeKey(tenantId, roleKey));
    if (origin === 'template' && (existing?.isCustomized || existing?.origin === 'tenant')) {
      return existing;
    }
    const record = {
      tenantId,
      roleKey,
      name: name || roleKey,
      permissions: Array.from(new Set(permissions)),
      isSystem: Boolean(isSystem),
      origin,
      isCustomized: Boolean(isCustomized),
    };
    customRoles.set(makeKey(tenantId, roleKey), record);
    return record;
  };

  const listRoles = async (tenantId) => {
    const merged = new Map();
    for (const [roleKey, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      merged.set(roleKey, { tenantId, roleKey, name: roleKey, permissions: perms, origin: 'system' });
    }
    for (const role of customRoles.values()) {
      if (role.tenantId === tenantId) merged.set(role.roleKey, role);
    }
    return Array.from(merged.values());
  };

  const hasPermission = async (tenantId, roleKey, requiredPermission) => {
    const perms = await getRolePermissions(tenantId, roleKey);
    return matchPermission(perms, requiredPermission);
  };

  const requirePermission = (...requiredPermissions) => async (req, res, next) => {
    const roleKey = req.user?.role;
    if (!roleKey) {
      return res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
    }
    const tenantId = getCurrentTenantId();
    const granted = await getRolePermissions(tenantId, roleKey);
    const missing = requiredPermissions.filter((perm) => !matchPermission(granted, perm));
    if (missing.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSION',
        missingPermissions: missing,
      });
    }
    return next();
  };

  return {
    getRolePermissions,
    upsertRole,
    listRoles,
    hasPermission,
    requirePermission,
  };
};

export const createPgPermissionService = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryPermissionService();

  const getRolePermissions = async (tenantId, roleKey) => {
    if (!roleKey) return [];
    try {
      const r = await query(
        `SELECT permissions FROM tenant_roles WHERE tenant_id = $1 AND role_key = $2 LIMIT 1`,
        [tenantId || DEFAULT_TENANT_ID, roleKey]
      );
      if (Array.isArray(r?.rows?.[0]?.permissions)) {
        return r.rows[0].permissions;
      }
    } catch { /* fallback */ }
    return mem.getRolePermissions(tenantId, roleKey);
  };

  return {
    ...mem,
    getRolePermissions,
    hasPermission: async (tenantId, roleKey, perm) =>
      matchPermission(await getRolePermissions(tenantId, roleKey), perm),
  };
};

export const permissionService = createPgPermissionService();
