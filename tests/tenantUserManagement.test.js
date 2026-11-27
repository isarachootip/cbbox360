import { describe, it, expect, vi } from 'vitest';
import { createInMemoryUserRepository, createPgUserRepository } from '../server/repositories/userRepository.js';
import { runWithTenantContext } from '../core/server/tenancy/tenantContext.js';
import { ensureOperatorAccounts } from '../server/services/userSeedService.js';
import {
  seedUsersForTenant,
  ensureAllTenantsSeedUsers,
} from '../server/services/tenantUserSeedService.js';

const mockHashPassword = async (plain) => `scrypt:${plain}`;

describe('Multi-Tenant User Management Seeding & Operator Sync', () => {
  it('assigns distinct primary keys per tenant so sync-operators never collides with default tenant', async () => {
    const userRepo = createInMemoryUserRepository();

    // 1. Seed operator accounts in default tenant
    const defaultCreated = await runWithTenantContext(
      { tenantId: 'default', tenantSlug: 'default' },
      () => ensureOperatorAccounts({ userRepo, hashPassword: mockHashPassword })
    );
    expect(defaultCreated).toHaveLength(6);

    // 2. Sync operator accounts in SINGER-SGC tenant (tnt_singer_sgc)
    const sgcCreated = await runWithTenantContext(
      { tenantId: 'tnt_singer_sgc', tenantSlug: 'singer-sgc' },
      () => ensureOperatorAccounts({ userRepo, hashPassword: mockHashPassword })
    );
    expect(sgcCreated).toHaveLength(6);

    const defaultUsers = await userRepo.listAll('default');
    const sgcUsers = await userRepo.listAll('tnt_singer_sgc');

    expect(defaultUsers).toHaveLength(6);
    expect(sgcUsers).toHaveLength(6);
    expect(defaultUsers.find((u) => u.username === 'tumtum')?.id).toBe('usr-tumtum');
    expect(sgcUsers.find((u) => u.username === 'tumtum')?.id).toBe('tnt_singer_sgc__usr-tumtum');

    // 3. Re-running sync-operators on SINGER-SGC is idempotent
    const secondSync = await runWithTenantContext(
      { tenantId: 'tnt_singer_sgc', tenantSlug: 'singer-sgc' },
      () => ensureOperatorAccounts({ userRepo, hashPassword: mockHashPassword })
    );
    expect(secondSync).toEqual([]);
    expect(await userRepo.listAll('tnt_singer_sgc')).toHaveLength(6);
  });

  it('seeds template-specific users from consumer_finance seed.yaml and backfills existing tenants', async () => {
    const userRepo = createInMemoryUserRepository();
    const mockTenantRepo = {
      listTenants: async () => [
        { id: 'default', slug: 'default', templateId: null, status: 'active' },
        { id: 'tnt_singer_sgc', slug: 'singer-sgc', templateId: 'consumer_finance', status: 'active' },
        { id: 'tnt_hospital', slug: 'hospital', templateId: 'hospital', status: 'active' },
      ],
    };

    const summary = await ensureAllTenantsSeedUsers({
      tenantRepo: mockTenantRepo,
      userRepo,
      hashPassword: mockHashPassword,
    });

    expect(summary.length).toBeGreaterThanOrEqual(2);

    const sgcUsers = await userRepo.listAll('tnt_singer_sgc');
    expect(sgcUsers.length).toBeGreaterThanOrEqual(6);
    expect(sgcUsers.some((u) => u.role === 'admin')).toBe(true);
    expect(sgcUsers.some((u) => u.role === 'SF_3')).toBe(true);

    const hospitalUsers = await userRepo.listAll('tnt_hospital');
    expect(hospitalUsers.some((u) => u.role === 'doctor')).toBe(true);
    expect(hospitalUsers.some((u) => u.role === 'nurse')).toBe(true);

    // Calling seedUsersForTenant again does not overwrite or duplicate accounts
    const countBefore = sgcUsers.length;
    const repeat = await seedUsersForTenant({
      tenantId: 'tnt_singer_sgc',
      templateId: 'consumer_finance',
      userRepo,
      hashPassword: mockHashPassword,
    });
    expect(repeat).toEqual([]);
    expect(await userRepo.listAll('tnt_singer_sgc')).toHaveLength(countBefore);
  });

  it('persists tenant-scoped users into PostgreSQL with distinct primary keys per tenant', async () => {
    const pgRows = [];
    const mockQuery = vi.fn(async (sql, params = []) => {
      const text = String(sql);
      if (text.includes('SELECT') && text.includes('WHERE tenant_id = $1 AND LOWER(username) = LOWER($2)')) {
        const [tid, uname] = params;
        const requireSysadmin = text.includes("role = 'sysadmin'");
        const found = pgRows.find(
          (r) =>
            r.tenant_id === tid &&
            r.username.toLowerCase() === String(uname).toLowerCase() &&
            (!requireSysadmin || r.role === 'sysadmin')
        );
        return { rows: found ? [found] : [] };
      }
      if (text.includes('SELECT') && text.includes('WHERE tenant_id = $1 ORDER BY')) {
        const [tid] = params;
        return { rows: pgRows.filter((r) => r.tenant_id === tid) };
      }
      if (text.includes('INSERT INTO users')) {
        const [id, tenant_id, username, email, display_name, role, department, skillsJson, extension, initials, avatar_bg, password_hash, must_change_password, is_active] = params;
        const pkCollision = pgRows.some((r) => r.id === id);
        const tenantUserCollision = pgRows.some(
          (r) => r.tenant_id === tenant_id && r.username.toLowerCase() === String(username).toLowerCase()
        );
        if (pkCollision || tenantUserCollision) return { rows: [] };
        const row = {
          id,
          tenant_id,
          username,
          email,
          display_name,
          role,
          department,
          skills: JSON.parse(skillsJson),
          extension,
          initials,
          avatar_bg,
          password_hash,
          must_change_password,
          is_active,
          totp_enabled: false,
          created_at: '2026-11-27T00:00:00Z',
          last_login_at: null,
        };
        pgRows.push(row);
        return { rows: [row] };
      }
      return { rows: [] };
    });

    const pgUserRepo = createPgUserRepository({ query: mockQuery });

    await ensureOperatorAccounts({ userRepo: pgUserRepo, hashPassword: mockHashPassword });
    await seedUsersForTenant({
      tenantId: 'tnt_singer_sgc',
      templateId: 'consumer_finance',
      userRepo: pgUserRepo,
      hashPassword: mockHashPassword,
    });

    const defaultPgUsers = await pgUserRepo.listAll('default');
    const sgcPgUsers = await pgUserRepo.listAll('tnt_singer_sgc');

    expect(defaultPgUsers).toHaveLength(6);
    expect(sgcPgUsers).toHaveLength(11); // 5 SINGER-SGC seed users + 6 standard operators
    expect(sgcPgUsers.map((u) => u.username)).toEqual(
      expect.arrayContaining(['sgc_admin', 'sgc_supervisor', 'sgc_loan1', 'sgc_collect1', 'sgc_care1', 'tumtum', 'tel_agent1'])
    );
  });
});
