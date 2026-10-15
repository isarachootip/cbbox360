/**
 * userRepository.js — data access for the users table (auth-related columns only).
 */
import { query } from '../../db.js';

const COLUMNS = `id, username, email, display_name, role, department, initials, avatar_bg,
  password_hash, must_change_password, is_active, totp_secret_encrypted, totp_enabled,
  failed_attempts, locked_until`;

export const userRepository = {
  async findByUsername(username) {
    const r = await query(`SELECT ${COLUMNS} FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
    return r.rows[0] ?? null;
  },

  async findById(id) {
    const r = await query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
    return r.rows[0] ?? null;
  },

  async recordFailedLogin(id, lockedUntil) {
    await query(
      `UPDATE users SET failed_attempts = failed_attempts + 1, locked_until = $2, updated_at = NOW() WHERE id = $1`,
      [id, lockedUntil]
    );
  },

  async recordSuccessfulLogin(id, at) {
    await query(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = $2, updated_at = NOW() WHERE id = $1`,
      [id, at]
    );
  },

  async updatePassword(id, passwordHash) {
    await query(
      `UPDATE users SET password_hash = $2, must_change_password = FALSE, updated_at = NOW() WHERE id = $1`,
      [id, passwordHash]
    );
  },

  async count() {
    const r = await query(`SELECT COUNT(*)::int AS n FROM users`);
    return r.rows[0]?.n ?? 0;
  },

  async insert(u) {
    await query(
      `INSERT INTO users (id, username, email, display_name, role, department, initials, avatar_bg,
         password_hash, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.username, u.email, u.displayName, u.role, u.department, u.initials, u.avatarBg, u.passwordHash, u.mustChangePassword]
    );
  },
};
