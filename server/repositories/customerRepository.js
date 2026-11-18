/**
 * customerRepository.js — Tenant-isolated PostgreSQL & in-memory data access for CDP contacts/customers.
 */
import { query as defaultDbQuery } from '../../db.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';

export const createInMemoryCustomerRepository = () => {
  const store = new Map(); // key: `${tenantId}::${upperId}`
  const makeKey = (tenantId, id) => `${tenantId || DEFAULT_TENANT_ID}::${String(id).toUpperCase()}`;

  return {
    async listAll(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const out = [];
      for (const [k, record] of store.entries()) {
        if (k.startsWith(`${tid}::`)) out.push(record);
      }
      return out.reverse();
    },

    async findById(customerId, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      return store.get(makeKey(tid, customerId)) ?? null;
    },

    async upsert(customer, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      store.set(makeKey(tid, customer.id), customer);
      return customer;
    },
  };
};

export const createPgCustomerRepository = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryCustomerRepository();

  return {
    async listAll(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      try {
        const r = await query(
          `SELECT data FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC, id DESC`,
          [tid]
        );
        if (r?.rows) {
          return r.rows.map((row) => row.data).filter(Boolean);
        }
      } catch { /* fallback to mem */ }
      return mem.listAll(tid);
    },

    async findById(customerId, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const key = String(customerId).toUpperCase();
      try {
        const r = await query(
          `SELECT data FROM customers WHERE tenant_id = $1 AND UPPER(id) = $2 LIMIT 1`,
          [tid, key]
        );
        if (r?.rows?.[0]?.data) return r.rows[0].data;
      } catch { /* fallback */ }
      return mem.findById(customerId, tid);
    },

    async upsert(customer, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      await mem.upsert(customer, tid);
      try {
        await query(
          `INSERT INTO customers (tenant_id, id, name, customer_type, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
           ON CONFLICT (tenant_id, id)
           DO UPDATE SET
             name = EXCLUDED.name,
             customer_type = EXCLUDED.customer_type,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            tid,
            customer.id,
            customer.name,
            customer.customerType || 'INDIVIDUAL',
            JSON.stringify(customer),
          ]
        );
      } catch { /* retained in mem when DB unavailable */ }
      return customer;
    },
  };
};

export const customerRepository = createPgCustomerRepository();
