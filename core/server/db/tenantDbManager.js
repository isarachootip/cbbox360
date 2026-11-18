/**
 * tenantDbManager.js — Tenant-isolated PostgreSQL execution manager.
 * - Shared DB mode: binds `app.current_tenant_id` inside a transaction for PostgreSQL RLS enforcement.
 * - Dedicated DB mode: lazily provisions & caches a dedicated pg.Pool per enterprise/on-prem tenant.
 */
import pkg from 'pg';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../tenancy/tenantContext.js';
import { decryptSecret } from '../../../server/utils/cryptoUtils.js';

const { Pool } = pkg;

const defaultPoolFactory = (connectionString) =>
  new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

/**
 * @param {{
 *   sharedPool: { connect: () => Promise<{ query: Function, release: Function }>, query?: Function },
 *   resolveTenantRecord?: (tenantId: string) => Promise<{ id: string, isolationMode?: string, dbDsnEncrypted?: string } | null>,
 *   decryptDsn?: (encrypted: string) => string | null,
 *   poolFactory?: (dsn: string) => { connect: Function, end: Function }
 * }} deps
 */
export const createTenantDbManager = ({
  sharedPool,
  resolveTenantRecord = async (id) => ({ id, isolationMode: 'shared_db' }),
  decryptDsn = decryptSecret,
  poolFactory = defaultPoolFactory,
}) => {
  const dedicatedPools = new Map();

  const resolvePoolForTenant = async (tenantId) => {
    const record = await resolveTenantRecord(tenantId);
    if (record?.isolationMode === 'dedicated_db' && record.dbDsnEncrypted) {
      if (!dedicatedPools.has(tenantId)) {
        const plainDsn = decryptDsn(record.dbDsnEncrypted);
        if (!plainDsn) {
          throw new Error(`TENANT_DSN_DECRYPT_FAILED:${tenantId}`);
        }
        dedicatedPools.set(tenantId, poolFactory(plainDsn));
      }
      return { pool: dedicatedPools.get(tenantId), isDedicated: true };
    }
    return { pool: sharedPool, isDedicated: false };
  };

  /**
   * Runs `work(client)` inside a transaction with PostgreSQL RLS session context bound to `tenantId`.
   */
  const withTransactionForTenant = async (tenantId, work) => {
    const effectiveTenant = tenantId || DEFAULT_TENANT_ID;
    const { pool } = await resolvePoolForTenant(effectiveTenant);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [effectiveTenant]);
      const output = await work(client);
      await client.query('COMMIT');
      return output;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback failure when connection dropped
      }
      throw err;
    } finally {
      client.release();
    }
  };

  const queryForTenant = async (tenantId, sql, params) =>
    withTransactionForTenant(tenantId, (client) => client.query(sql, params));

  const query = async (sql, params) => queryForTenant(getCurrentTenantId(), sql, params);

  const withTransaction = async (work) => withTransactionForTenant(getCurrentTenantId(), work);

  const closeDedicatedPools = async () => {
    for (const pool of dedicatedPools.values()) {
      await pool.end();
    }
    dedicatedPools.clear();
  };

  return {
    query,
    queryForTenant,
    withTransaction,
    withTransactionForTenant,
    closeDedicatedPools,
  };
};
