import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations, rollbackLastMigration } from '../migrationRunner.js';
import { createTenantDbManager } from '../tenantDbManager.js';
import { runWithTenantContext, getCurrentTenantId } from '../../tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CORE_MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

const createMockExecutor = () => {
  const applied = new Map();
  const executedSql = [];

  const query = vi.fn(async (sql, params = []) => {
    const trimmed = String(sql).trim();
    executedSql.push({ sql: trimmed, params });

    if (/SELECT version, checksum FROM schema_migrations WHERE scope = \$1/i.test(trimmed)) {
      const scope = params[0];
      const rows = [];
      for (const [key, val] of applied.entries()) {
        if (key.startsWith(`${scope}:`)) rows.push(val);
      }
      rows.sort((a, b) => a.version.localeCompare(b.version));
      return { rows };
    }

    if (/INSERT INTO schema_migrations/i.test(trimmed)) {
      const [scope, version, checksum] = params;
      applied.set(`${scope}:${version}`, { version, checksum });
      return { rows: [] };
    }

    if (/DELETE FROM schema_migrations WHERE scope = \$1 AND version = \$2/i.test(trimmed)) {
      const [scope, version] = params;
      applied.delete(`${scope}:${version}`);
      return { rows: [] };
    }

    return { rows: [{ ok: 1 }] };
  });

  return { query, applied, executedSql };
};

describe('SQL Migration Runner & TenantDbManager (Phase 2 - PR-01)', () => {
  it('applies core migrations in order, records checksums, and skips already applied versions', async () => {
    const mockDb = createMockExecutor();

    const firstRun = await runMigrations({
      db: mockDb,
      scope: 'core',
      migrationsDir: CORE_MIGRATIONS_DIR,
    });

    expect(firstRun.applied).toEqual([
      '001_tenant_control_plane',
      '002_custom_fields_and_rls',
      '003_entity_custom_field_values',
      '004_tenant_scoped_customers_and_chats',
      '005_tenant_scoped_users',
      '006_tenant_scoped_cases',
      '007_case_field_service_fields',
    ]);
    expect(mockDb.applied.size).toBe(7);

    const secondRun = await runMigrations({
      db: mockDb,
      scope: 'core',
      migrationsDir: CORE_MIGRATIONS_DIR,
    });
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toEqual([
      '001_tenant_control_plane',
      '002_custom_fields_and_rls',
      '003_entity_custom_field_values',
      '004_tenant_scoped_customers_and_chats',
      '005_tenant_scoped_users',
      '006_tenant_scoped_cases',
      '007_case_field_service_fields',
    ]);
  });

  it('rolls back the latest migration cleanly using its paired .down.sql file', async () => {
    const mockDb = createMockExecutor();
    await runMigrations({ db: mockDb, scope: 'core', migrationsDir: CORE_MIGRATIONS_DIR });

    const rolledBack = await rollbackLastMigration({
      db: mockDb,
      scope: 'core',
      migrationsDir: CORE_MIGRATIONS_DIR,
    });

    expect(rolledBack.rolledBack).toBe('007_case_field_service_fields');
    expect(mockDb.applied.has('core:007_case_field_service_fields')).toBe(false);
    expect(mockDb.applied.has('core:006_tenant_scoped_cases')).toBe(true);
    expect(mockDb.applied.has('core:001_tenant_control_plane')).toBe(true);
  });

  it('propagates tenantId via AsyncLocalStorage and sets RLS app.current_tenant_id on shared pool', async () => {
    expect(getCurrentTenantId()).toBe('default');

    const clientCalls = [];
    const mockClient = {
      query: vi.fn(async (sql, params) => {
        clientCalls.push({ sql: String(sql).trim(), params });
        return { rows: [{ id: 'C00123' }] };
      }),
      release: vi.fn(),
    };
    const sharedPool = {
      connect: vi.fn(async () => mockClient),
    };

    const manager = createTenantDbManager({
      sharedPool,
      resolveTenantRecord: async (id) => ({ id, isolationMode: 'shared_db' }),
    });

    const result = await runWithTenantContext(
      { tenantId: 'tnt_hosp_rama', tenantSlug: 'rama' },
      async () => {
        expect(getCurrentTenantId()).toBe('tnt_hosp_rama');
        return manager.query('SELECT id FROM customers WHERE id = $1', ['C00123']);
      }
    );

    expect(result.rows).toEqual([{ id: 'C00123' }]);
    expect(clientCalls[0]).toEqual({ sql: 'BEGIN', params: undefined });
    expect(clientCalls[1]).toEqual({
      sql: `SELECT set_config('app.current_tenant_id', $1, true)`,
      params: ['tnt_hosp_rama'],
    });
    expect(clientCalls[2]).toEqual({
      sql: 'SELECT id FROM customers WHERE id = $1',
      params: ['C00123'],
    });
    expect(clientCalls[3]).toEqual({ sql: 'COMMIT', params: undefined });
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('routes queries to a dedicated tenant pool when isolationMode is dedicated_db', async () => {
    const sharedPool = { connect: vi.fn() };
    const dedicatedClient = {
      query: vi.fn(async () => ({ rows: [{ isolated: true }] })),
      release: vi.fn(),
    };
    const dedicatedPool = { connect: vi.fn(async () => dedicatedClient), end: vi.fn() };
    const poolFactory = vi.fn(() => dedicatedPool);

    const manager = createTenantDbManager({
      sharedPool,
      decryptDsn: (enc) => `postgresql://dedicated/${enc}`,
      poolFactory,
      resolveTenantRecord: async (id) => ({
        id,
        isolationMode: 'dedicated_db',
        dbDsnEncrypted: 'hosp_enterprise_db',
      }),
    });

    const res = await manager.queryForTenant('tnt_enterprise', 'SELECT 1');
    expect(res.rows).toEqual([{ isolated: true }]);
    expect(poolFactory).toHaveBeenCalledWith('postgresql://dedicated/hosp_enterprise_db');
    expect(sharedPool.connect).not.toHaveBeenCalled();
  });
});
