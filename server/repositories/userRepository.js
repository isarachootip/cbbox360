/**
 * userRepository.js — data access for the users table (auth-related columns only).
 * Falls back to in-memory storage when PostgreSQL is unavailable.
 */
import { query } from '../../db.js';

const COLUMNS = `id, username, email, display_name, role, department, initials, avatar_bg,
  password_hash, must_change_password, is_active, totp_secret_encrypted, totp_enabled,
  failed_attempts, locked_until, last_login_at`;

const inMemoryUsers = new Map();

const toRow = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  display_name: u.displayName,
  role: u.role,
  department: u.department,
  initials: u.initials,
  avatar_bg: u.avatarBg ?? '#CFE2F8',
  password_hash: u.passwordHash,
  must_change_password: Boolean(u.mustChangePassword),
  is_active: true,
  totp_secret_encrypted: null,
  totp_enabled: false,
  failed_attempts: 0,
  locked_until: null,
  last_login_at: null,
});

export const userRepository = {
  async findByUsername(username) {
    try {
      const r = await query(`SELECT ${COLUMNS} FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
      if (r.rows[0]) return r.rows[0];
    } catch {
      // Fallback to in-memory store
    }
    const lower = String(username).toLowerCase();
    for (const row of inMemoryUsers.values()) {
      if (row.username.toLowerCase() === lower) return { ...row };
    }
    return null;
  },

  async findById(id) {
    try {
      const r = await query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
      if (r.rows[0]) return r.rows[0];
    } catch {
      // Fallback to in-memory store
    }
    const row = inMemoryUsers.get(id);
    return row ? { ...row } : null;
  },

  async recordFailedLogin(id, lockedUntil) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.failed_attempts = (mem.failed_attempts || 0) + 1;
      mem.locked_until = lockedUntil;
    }
    try {
      await query(
        `UPDATE users SET failed_attempts = failed_attempts + 1, locked_until = $2, updated_at = NOW() WHERE id = $1`,
        [id, lockedUntil]
      );
    } catch {
      // Handled in memory
    }
  },

  async recordSuccessfulLogin(id, at) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.failed_attempts = 0;
      mem.locked_until = null;
      mem.last_login_at = at;
    }
    try {
      await query(
        `UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = $2, updated_at = NOW() WHERE id = $1`,
        [id, at]
      );
    } catch {
      // Handled in memory
    }
  },

  async updatePassword(id, passwordHash) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.password_hash = passwordHash;
      mem.must_change_password = false;
      mem.failed_attempts = 0;
      mem.locked_until = null;
    }
    try {
      await query(
        `UPDATE users SET password_hash = $2, must_change_password = FALSE, failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`,
        [id, passwordHash]
      );
    } catch {
      // Handled in memory
    }
  },

  async resetPassword(id, passwordHash) {
    const mem = inMemoryUsers.get(id);
    if (mem) {
      mem.password_hash = passwordHash;
      mem.must_change_password = true;
      mem.failed_attempts = 0;
      mem.locked_until = null;
    }
    try {
      await query(
        `UPDATE users SET password_hash = $2, must_change_password = TRUE, failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`,
        [id, passwordHash]
      );
    } catch {
      // Handled in memory
    }
  },

  async count() {
    try {
      const r = await query(`SELECT COUNT(*)::int AS n FROM users`);
      return r.rows[0]?.n ?? 0;
    } catch {
      return inMemoryUsers.size;
    }
  },

  async insert(u) {
    if (!inMemoryUsers.has(u.id)) {
      inMemoryUsers.set(u.id, toRow(u));
    }
    try {
      await query(
        `INSERT INTO users (id, username, email, display_name, role, department, initials, avatar_bg,
           password_hash, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.username, u.email, u.displayName, u.role, u.department, u.initials, u.avatarBg, u.passwordHash, u.mustChangePassword]
      );
    } catch {
      // Handled in memory
    }
  },
};
