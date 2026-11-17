/**
 * consentRepository.js — PostgreSQL persistence for PDPA DSR requests and Privacy Policies
 * with automatic in-memory fallback when PostgreSQL is unavailable.
 */
import { query } from '../../db.js';

const inMemoryDsr = new Map();
const inMemoryPolicies = new Map();

export const consentRepository = {
  async listDsr() {
    try {
      const r = await query(
        `SELECT data FROM consent_dsr_requests ORDER BY created_at DESC, id DESC`
      );
      if (r?.rows) return r.rows.map((row) => row.data).filter(Boolean);
    } catch {
      // Fallback to in-memory
    }
    return Array.from(inMemoryDsr.values()).reverse();
  },

  async upsertDsr(dsrRequest) {
    const key = String(dsrRequest.id).toUpperCase();
    inMemoryDsr.set(key, dsrRequest);
    try {
      await query(
        `INSERT INTO consent_dsr_requests (id, customer_id, status, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           status = EXCLUDED.status,
           data = EXCLUDED.data,
           updated_at = NOW()`,
        [dsrRequest.id, dsrRequest.customerId, dsrRequest.status, JSON.stringify(dsrRequest)]
      );
    } catch {
      // Kept in inMemoryDsr when offline
    }
    return dsrRequest;
  },

  async listPolicies() {
    try {
      const r = await query(
        `SELECT data FROM consent_policies ORDER BY is_active DESC, updated_at DESC`
      );
      if (r?.rows) return r.rows.map((row) => row.data).filter(Boolean);
    } catch {
      // Fallback to in-memory
    }
    return Array.from(inMemoryPolicies.values()).reverse();
  },

  async upsertPolicy(policy) {
    const key = String(policy.id);
    if (policy.isActive) {
      for (const [k, existing] of inMemoryPolicies.entries()) {
        if (k !== key && existing.isActive) {
          inMemoryPolicies.set(k, { ...existing, isActive: false });
        }
      }
    }
    inMemoryPolicies.set(key, policy);
    try {
      if (policy.isActive) {
        await query(
          `UPDATE consent_policies
              SET is_active = FALSE,
                  data = jsonb_set(data, '{isActive}', 'false'::jsonb),
                  updated_at = NOW()
            WHERE id <> $1 AND is_active = TRUE`,
          [policy.id]
        );
      }
      await query(
        `INSERT INTO consent_policies (id, version, is_active, data, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           version = EXCLUDED.version,
           is_active = EXCLUDED.is_active,
           data = EXCLUDED.data,
           updated_at = NOW()`,
        [policy.id, policy.version, Boolean(policy.isActive), JSON.stringify(policy)]
      );
    } catch {
      // Kept in inMemoryPolicies when offline
    }
    return policy;
  },
};
