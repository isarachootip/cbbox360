/**
 * industryProfileRepository.js — data access for customer_industry_profiles.
 */
import { query } from '../../db.js';

export const industryProfileRepository = {
  async get(customerId, kind) {
    const r = await query(
      `SELECT data FROM customer_industry_profiles WHERE customer_id = $1 AND kind = $2`,
      [customerId, kind]
    );
    return r.rows[0]?.data ?? null;
  },

  async upsert(customerId, kind, data, updatedBy) {
    await query(
      `INSERT INTO customer_industry_profiles (customer_id, kind, data, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (customer_id, kind)
       DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [customerId, kind, JSON.stringify(data), updatedBy]
    );
  },
};
