/**
 * industryProfileRepository.js — data access for customer_industry_profiles.
 */
import { query } from '../../db.js';
import { findSeedIndustryProfile } from '../../shared/industryProfileSeed.js';

const inMemoryStore = new Map();
const makeKey = (customerId, kind) => `${String(customerId).toUpperCase()}:${kind}`;

export const industryProfileRepository = {
  async get(customerId, kind) {
    const key = makeKey(customerId, kind);
    try {
      const r = await query(
        `SELECT data FROM customer_industry_profiles WHERE UPPER(customer_id) = UPPER($1) AND kind = $2`,
        [customerId, kind]
      );
      if (r.rows[0]?.data) {
        return r.rows[0].data;
      }
    } catch {
      // Fallback to in-memory / seed if PostgreSQL is unavailable
    }
    if (inMemoryStore.has(key)) {
      return inMemoryStore.get(key);
    }
    return findSeedIndustryProfile(customerId, kind);
  },

  async upsert(customerId, kind, data, updatedBy) {
    const key = makeKey(customerId, kind);
    inMemoryStore.set(key, data);
    try {
      await query(
        `INSERT INTO customer_industry_profiles (customer_id, kind, data, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (customer_id, kind)
         DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [customerId, kind, JSON.stringify(data), updatedBy]
      );
    } catch {
      // Kept in inMemoryStore when PostgreSQL is unavailable
    }
  },
};
