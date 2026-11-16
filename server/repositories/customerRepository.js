/**
 * customerRepository.js — PostgreSQL data access for CDP customers with in-memory fallback.
 */
import { query } from '../../db.js';

const inMemoryCustomers = new Map();

export const customerRepository = {
  async listAll() {
    try {
      const r = await query(
        `SELECT data FROM customers ORDER BY created_at DESC, id DESC`
      );
      if (r?.rows) {
        return r.rows.map((row) => row.data).filter(Boolean);
      }
    } catch {
      // Fallback to in-memory store when PostgreSQL is unavailable
    }
    return Array.from(inMemoryCustomers.values()).reverse();
  },

  async findById(customerId) {
    const key = String(customerId).toUpperCase();
    try {
      const r = await query(
        `SELECT data FROM customers WHERE UPPER(id) = $1`,
        [key]
      );
      if (r?.rows?.[0]?.data) {
        return r.rows[0].data;
      }
    } catch {
      // Fallback to in-memory store
    }
    return inMemoryCustomers.get(key) ?? null;
  },

  async upsert(customer) {
    const key = String(customer.id).toUpperCase();
    inMemoryCustomers.set(key, customer);
    try {
      await query(
        `INSERT INTO customers (id, name, customer_type, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           name = EXCLUDED.name,
           customer_type = EXCLUDED.customer_type,
           data = EXCLUDED.data,
           updated_at = NOW()`,
        [
          customer.id,
          customer.name,
          customer.customerType || 'INDIVIDUAL',
          JSON.stringify(customer),
        ]
      );
    } catch {
      // Retained in inMemoryCustomers when PostgreSQL is offline
    }
    return customer;
  },
};
