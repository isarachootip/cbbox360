/**
 * sessionRepository.js — data access for the sessions table.
 * `id` is the SHA-256 hash of the session token; raw tokens are never stored.
 */
import { query } from '../../db.js';

const toSession = (row) =>
  row
    ? { id: row.id, userId: row.user_id, authStage: row.auth_stage, expiresAt: row.expires_at }
    : null;

export const sessionRepository = {
  async create(s) {
    await query(
      `INSERT INTO sessions (id, user_id, auth_stage, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [s.id, s.userId, s.authStage, s.ip, s.userAgent, s.expiresAt]
    );
  },

  async findById(id) {
    const r = await query(`SELECT id, user_id, auth_stage, expires_at FROM sessions WHERE id = $1`, [id]);
    return toSession(r.rows[0]);
  },

  async delete(id) {
    await query(`DELETE FROM sessions WHERE id = $1`, [id]);
  },

  async deleteByUserExcept(userId, keepId) {
    await query(`DELETE FROM sessions WHERE user_id = $1 AND ($2::text IS NULL OR id <> $2)`, [userId, keepId]);
  },

  async deleteExpired() {
    await query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
  },
};
