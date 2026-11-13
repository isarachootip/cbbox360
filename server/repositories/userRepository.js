/**
 * userRepository.js — data access for the users table.
 * Falls back to in-memory storage when PostgreSQL is unavailable.
 */
import { query } from '../../db.js';

const COLUMNS = `id, username, email, display_name, role, department, skills, extension, initials, avatar_bg,
  password_hash, must_change_password, is_active, totp_secret_encrypted, totp_enabled,
  failed_attempts, locked_until, last_login_at, created_at`;

const inMemoryUsers = new Map();

const toRow = (u) => ({
  id: u.id,
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

const tryDb = async (sql, params) => {
  try {
    return await query(sql, params);
  } catch {
    return null;
  }
};

export const userRepository = {
  async listAll() {
    const r = await tryDb(`SELECT ${COLUMNS} FROM users ORDER BY created_at ASC, id ASC`);
    return r ? r.rows : Array.from(inMemoryUsers.values()).map((row) => ({ ...row }));
  },

  async findByUsername(username) {
    const r = await tryDb(`SELECT ${COLUMNS} FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
    if (r) return r.rows[0] ?? null;
    const lower = String(username).toLowerCase();
    for (const row of inMemoryUsers.values()) {
      if (row.username.toLowerCase() === lower) return { ...row };
    }
    return null;
  },

  async findById(id) {
    const r = await tryDb(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
    if (r) return r.rows[0] ?? null;
    const row = inMemoryUsers.get(id);
    return row ? { ...row } : null;
  },

  async recordFailedLogin(id, lockedUntil) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.failed_attempts = (mem.failed_attempts || 0) + 1;
      mem.locked_until = lockedUntil;
    }
    await tryDb(
      `UPDATE users SET failed_attempts = failed_attempts + 1, locked_until = $2, updated_at = NOW() WHERE id = $1`,
      [id, lockedUntil]
    );
  },

  async recordSuccessfulLogin(id, at) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.failed_attempts = 0;
      mem.locked_until = null;
      mem.last_login_at = at;
    }
    await tryDb(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = $2, updated_at = NOW() WHERE id = $1`,
      [id, at]
    );
  },

  async setPassword(id, passwordHash, mustChangePassword) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.password_hash = passwordHash;
      mem.must_change_password = Boolean(mustChangePassword);
      mem.failed_attempts = 0;
      mem.locked_until = null;
    }
    await tryDb(
      `UPDATE users SET password_hash = $2, must_change_password = $3, failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`,
      [id, passwordHash, Boolean(mustChangePassword)]
    );
  },

  async updatePassword(id, passwordHash) {
    return this.setPassword(id, passwordHash, false);
  },

  async resetPassword(id, passwordHash) {
    return this.setPassword(id, passwordHash, true);
  },

  async updateProfile(id, fields) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      Object.assign(mem, {
        username: fields.username,
        email: fields.email,
        display_name: fields.displayName,
        role: fields.role,
        department: fields.department,
        skills: fields.skills ?? [],
        extension: fields.extension ?? '',
        initials: fields.initials,
        avatar_bg: fields.avatarBg,
        is_active: fields.isActive,
      });
    }
    const r = await tryDb(
      `UPDATE users
          SET username = $2, email = $3, display_name = $4, role = $5,
              department = $6, initials = $7, avatar_bg = $8, is_active = $9,
              skills = $10::jsonb, extension = $11, updated_at = NOW()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, fields.username, fields.email, fields.displayName, fields.role, fields.department, fields.initials, fields.avatarBg, fields.isActive, JSON.stringify(fields.skills ?? []), fields.extension ?? '']
    );
    return r?.rows[0] ?? (mem ? { ...mem } : null);
  },

  async setActive(id, isActive) {
    const mem = inMemoryUsers.get(id);
    if (mem) mem.is_active = Boolean(isActive);
    await tryDb(`UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1`, [id, Boolean(isActive)]);
  },

  async setTotp(id, { enabled, secretEncrypted }) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.totp_enabled = Boolean(enabled);
      mem.totp_secret_encrypted = enabled ? secretEncrypted : null;
    }
    await tryDb(
      `UPDATE users
          SET totp_enabled = $2, totp_secret_encrypted = $3,
              totp_enrolled_at = CASE WHEN $2 THEN NOW() ELSE NULL END, updated_at = NOW()
        WHERE id = $1`,
      [id, Boolean(enabled), enabled ? secretEncrypted : null]
    );
  },

  async deleteById(id) {
    inMemoryUsers.delete(id);
    await tryDb(`DELETE FROM users WHERE id = $1`, [id]);
  },

  async count() {
    const r = await tryDb(`SELECT COUNT(*)::int AS n FROM users`);
    return r ? (r.rows[0]?.n ?? 0) : inMemoryUsers.size;
  },

  async insert(u) {
    const row = toRow(u);
    if (!inMemoryUsers.has(u.id)) inMemoryUsers.set(u.id, row);
    const r = await tryDb(
      `INSERT INTO users (id, username, email, display_name, role, department, skills, extension, initials, avatar_bg,
         password_hash, must_change_password, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING
       RETURNING ${COLUMNS}`,
      [u.id, u.username, u.email ?? '', u.displayName, u.role, u.department ?? '', JSON.stringify(u.skills ?? []), u.extension ?? '', u.initials, u.avatarBg ?? '#CFE2F8', u.passwordHash, Boolean(u.mustChangePassword), u.isActive !== false]
    );
    return r?.rows[0] ?? { ...row };
  },
};
