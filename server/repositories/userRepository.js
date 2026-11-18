/**
 * userRepository.js — Tenant-scoped PostgreSQL data access for the `users` table.
 * Isolates customer users per `tenant_id` while permitting Platform `sysadmin` support login
 * across SaaS tenants (unless locked in On-Prem `single_tenant` mode).
 */
import { query as defaultDbQuery } from '../../db.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';
import { createInMemoryUserRepository } from './inMemoryUserRepository.js';

export { createInMemoryUserRepository };

const COLUMNS = `id, tenant_id, username, email, display_name, role, department, skills, extension, initials, avatar_bg,
  password_hash, must_change_password, is_active, totp_secret_encrypted, totp_enabled,
  failed_attempts, locked_until, last_login_at, created_at`;

export const createPgUserRepository = ({
  query = defaultDbQuery,
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
} = {}) => {
  const mem = createInMemoryUserRepository({ deploymentMode });
  const tryDb = async (sql, params) => {
    try { return await query(sql, params); } catch { return null; }
  };

  return {
    async listAll(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const r = await tryDb(`SELECT ${COLUMNS} FROM users WHERE tenant_id = $1 ORDER BY created_at ASC, id ASC`, [tid]);
      return r ? r.rows : mem.listAll(tid);
    },

    async findByUsername(username, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const r = await tryDb(`SELECT ${COLUMNS} FROM users WHERE tenant_id = $1 AND LOWER(username) = LOWER($2) LIMIT 1`, [tid, username]);
      if (r?.rows?.[0]) return r.rows[0];
      if (tid !== DEFAULT_TENANT_ID && deploymentMode !== 'single_tenant') {
        const sup = await tryDb(
          `SELECT ${COLUMNS} FROM users WHERE tenant_id = $1 AND LOWER(username) = LOWER($2) AND role = 'sysadmin' LIMIT 1`,
          [DEFAULT_TENANT_ID, username]
        );
        if (sup?.rows?.[0]) return sup.rows[0];
      }
      if (r) return null;
      return mem.findByUsername(username, tid);
    },

    async findById(id) {
      const r = await tryDb(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
      return r ? (r.rows[0] ?? null) : mem.findById(id);
    },

    async recordFailedLogin(id, lockedUntil) {
      await mem.recordFailedLogin(id, lockedUntil);
      await tryDb(`UPDATE users SET failed_attempts = failed_attempts + 1, locked_until = $2, updated_at = NOW() WHERE id = $1`, [id, lockedUntil]);
    },

    async recordSuccessfulLogin(id, at) {
      await mem.recordSuccessfulLogin(id, at);
      await tryDb(`UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = $2, updated_at = NOW() WHERE id = $1`, [id, at]);
    },

    async setPassword(id, passwordHash, mustChangePassword) {
      await mem.setPassword(id, passwordHash, mustChangePassword);
      await tryDb(`UPDATE users SET password_hash = $2, must_change_password = $3, failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`, [id, passwordHash, Boolean(mustChangePassword)]);
    },

    updatePassword(id, passwordHash) { return this.setPassword(id, passwordHash, false); },
    resetPassword(id, passwordHash) { return this.setPassword(id, passwordHash, true); },

    async updateProfile(id, fields) {
      const m = await mem.updateProfile(id, fields);
      const r = await tryDb(
        `UPDATE users SET username=$2, email=$3, display_name=$4, role=$5, department=$6, initials=$7, avatar_bg=$8, is_active=$9, skills=$10::jsonb, extension=$11, updated_at=NOW() WHERE id=$1 RETURNING ${COLUMNS}`,
        [id, fields.username, fields.email, fields.displayName, fields.role, fields.department, fields.initials, fields.avatarBg, fields.isActive, JSON.stringify(fields.skills ?? []), fields.extension ?? '']
      );
      return r?.rows[0] ?? m;
    },

    async setActive(id, isActive) {
      await mem.setActive(id, isActive);
      await tryDb(`UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1`, [id, Boolean(isActive)]);
    },

    async setTotp(id, opts) {
      await mem.setTotp(id, opts);
      await tryDb(`UPDATE users SET totp_enabled=$2, totp_secret_encrypted=$3, totp_enrolled_at=CASE WHEN $2 THEN NOW() ELSE NULL END, updated_at=NOW() WHERE id=$1`, [id, Boolean(opts.enabled), opts.enabled ? opts.secretEncrypted : null]);
    },

    async deleteById(id) {
      await mem.deleteById(id);
      await tryDb(`DELETE FROM users WHERE id = $1`, [id]);
    },

    async count(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const r = await tryDb(`SELECT COUNT(*)::int AS n FROM users WHERE tenant_id = $1`, [tid]);
      return r ? (r.rows[0]?.n ?? 0) : mem.count(tid);
    },

    async insert(u, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const m = await mem.insert(u, tid);
      const r = await tryDb(
        `INSERT INTO users (id, tenant_id, username, email, display_name, role, department, skills, extension, initials, avatar_bg, password_hash, must_change_password, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING RETURNING ${COLUMNS}`,
        [u.id, tid, u.username, u.email ?? '', u.displayName, u.role, u.department ?? '', JSON.stringify(u.skills ?? []), u.extension ?? '', u.initials, u.avatarBg ?? '#CFE2F8', u.passwordHash, Boolean(u.mustChangePassword), u.isActive !== false]
      );
      return r?.rows[0] ?? m;
    },
  };
};

export const userRepository = createPgUserRepository();
