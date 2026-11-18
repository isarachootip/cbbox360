/**
 * inMemoryUserRepository.js — Tenant-scoped in-memory store for `users` (fallback & unit test store).
 */
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';

export const toUserRow = (u, tenantId) => ({
  id: u.id,
  tenant_id: tenantId || u.tenantId || DEFAULT_TENANT_ID,
  username: u.username,
  email: u.email ?? '',
  display_name: u.displayName,
  role: u.role,
  department: u.department ?? '',
  skills: Array.isArray(u.skills) ? u.skills : [],
  extension: u.extension ?? '',
  initials: u.initials,
  avatar_bg: u.avatarBg ?? '#CFE2F8',
  password_hash: u.passwordHash,
  must_change_password: Boolean(u.mustChangePassword),
  is_active: u.isActive !== false,
  totp_secret_encrypted: null,
  totp_enabled: false,
  failed_attempts: 0,
  locked_until: null,
  last_login_at: null,
  created_at: u.createdAt ?? new Date().toISOString(),
});

export const createInMemoryUserRepository = ({
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
} = {}) => {
  const usersById = new Map();

  return {
    async listAll(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      return Array.from(usersById.values())
        .filter((row) => (row.tenant_id || DEFAULT_TENANT_ID) === tid)
        .map((row) => ({ ...row }));
    },

    async findByUsername(username, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const lower = String(username || '').toLowerCase();
      for (const row of usersById.values()) {
        if ((row.tenant_id || DEFAULT_TENANT_ID) === tid && row.username.toLowerCase() === lower) {
          return { ...row };
        }
      }
      if (tid !== DEFAULT_TENANT_ID && deploymentMode !== 'single_tenant') {
        for (const row of usersById.values()) {
          if (
            (row.tenant_id || DEFAULT_TENANT_ID) === DEFAULT_TENANT_ID &&
            row.username.toLowerCase() === lower &&
            row.role === 'sysadmin'
          ) {
            return { ...row };
          }
        }
      }
      return null;
    },

    async findById(id) {
      const row = usersById.get(id);
      return row ? { ...row } : null;
    },

    async recordFailedLogin(id, lockedUntil) {
      const mem = usersById.get(id);
      if (mem) {
        mem.failed_attempts = (mem.failed_attempts || 0) + 1;
        mem.locked_until = lockedUntil;
      }
    },

    async recordSuccessfulLogin(id, at) {
      const mem = usersById.get(id);
      if (mem) {
        mem.failed_attempts = 0;
        mem.locked_until = null;
        mem.last_login_at = at;
      }
    },

    async setPassword(id, passwordHash, mustChangePassword) {
      const mem = usersById.get(id);
      if (mem) {
        mem.password_hash = passwordHash;
        mem.must_change_password = Boolean(mustChangePassword);
        mem.failed_attempts = 0;
        mem.locked_until = null;
      }
    },

    updatePassword(id, passwordHash) { return this.setPassword(id, passwordHash, false); },
    resetPassword(id, passwordHash) { return this.setPassword(id, passwordHash, true); },

    async updateProfile(id, fields) {
      const mem = usersById.get(id);
      if (!mem) return null;
      Object.assign(mem, {
        username: fields.username, email: fields.email, display_name: fields.displayName,
        role: fields.role, department: fields.department, skills: fields.skills ?? [],
        extension: fields.extension ?? '', initials: fields.initials, avatar_bg: fields.avatarBg,
        is_active: fields.isActive,
      });
      return { ...mem };
    },

    async setActive(id, isActive) {
      const mem = usersById.get(id);
      if (mem) mem.is_active = Boolean(isActive);
    },

    async setTotp(id, { enabled, secretEncrypted }) {
      const mem = usersById.get(id);
      if (mem) {
        mem.totp_enabled = Boolean(enabled);
        mem.totp_secret_encrypted = enabled ? secretEncrypted : null;
      }
    },

    async deleteById(id) { usersById.delete(id); },

    async count(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      return (await this.listAll(tid)).length;
    },

    async insert(u, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const row = toUserRow(u, tid);
      if (!usersById.has(u.id)) usersById.set(u.id, row);
      return { ...row };
    },
  };
};
