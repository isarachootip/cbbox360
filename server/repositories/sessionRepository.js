/**
 * sessionRepository.js — data access for the sessions table.
 * `id` is the SHA-256 hash of the session token; raw tokens are never stored.
 * Falls back to in-memory storage when PostgreSQL is unavailable.
 */
import { query } from '../../db.js';

const inMemorySessions = new Map();

const toSession = (row) =>
  row
    ? { id: row.id, userId: row.user_id, authStage: row.auth_stage, expiresAt: row.expires_at }
    : null;

export const sessionRepository = {
  async create(s) {
    inMemorySessions.set(s.id, {
      id: s.id,
      user_id: s.userId,
      auth_stage: s.authStage,
      expires_at: s.expiresAt,
    });
    try {
      await query(
        `INSERT INTO sessions (id, user_id, auth_stage, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.id, s.userId, s.authStage, s.ip, s.userAgent, s.expiresAt]
      );
    } catch {
      // Handled in memory
    }
  },

  async findById(id) {
    try {
      const r = await query(`SELECT id, user_id, auth_stage, expires_at FROM sessions WHERE id = $1`, [id]);
      if (r.rows[0]) return toSession(r.rows[0]);
    } catch {
      // Fallback to in-memory store
    }
    return toSession(inMemorySessions.get(id));
  },

  async delete(id) {
    inMemorySessions.delete(id);
    try {
      await query(`DELETE FROM sessions WHERE id = $1`, [id]);
    } catch {
      // Handled in memory
    }
  },

  async deleteByUserExcept(userId, keepId) {
    for (const [id, s] of inMemorySessions.entries()) {
      if (s.user_id === userId && (!keepId || id !== keepId)) {
        inMemorySessions.delete(id);
      }
    }
    try {
      await query(`DELETE FROM sessions WHERE user_id = $1 AND ($2::text IS NULL OR id <> $2)`, [userId, keepId]);
    } catch {
      // Handled in memory
    }
  },

  async deleteExpired() {
    const now = Date.now();
    for (const [id, s] of inMemorySessions.entries()) {
      if (new Date(s.expires_at).getTime() <= now) {
        inMemorySessions.delete(id);
      }
    }
    try {
      await query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
    } catch {
      // Handled in memory
    }
  },
};
