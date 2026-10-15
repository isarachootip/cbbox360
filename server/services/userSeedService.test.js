import { describe, it, expect, vi } from 'vitest';
import { ensureSeedUsers, ensureAllSeedAccounts, SEED_USERS } from './userSeedService.js';

const makeRepo = (count) => ({ count: vi.fn(async () => count), insert: vi.fn(async () => {}) });
const hashPassword = vi.fn(async (p) => `hash:${p}`);

describe('ensureSeedUsers', () => {
  it('does nothing when users already exist', async () => {
    const repo = makeRepo(3);
    expect(await ensureSeedUsers({ userRepo: repo, hashPassword, nodeEnv: 'development' })).toEqual([]);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('development: uses the configured default password and forces a change on first login', async () => {
    const repo = makeRepo(0);
    await ensureSeedUsers({ userRepo: repo, hashPassword, nodeEnv: 'development', defaultPassword: 'dev-pass' });
    expect(repo.insert).toHaveBeenCalledTimes(SEED_USERS.length);
    const first = repo.insert.mock.calls[0][0];
    expect(first.passwordHash).toBe('hash:dev-pass');
    expect(first.mustChangePassword).toBe(true);
  });

  it('production: generates a unique random password per user (never a shared default)', async () => {
    const repo = makeRepo(0);
    const created = await ensureSeedUsers({ userRepo: repo, hashPassword, nodeEnv: 'production', defaultPassword: '1234' });
    const passwords = created.map((c) => c.temporaryPassword);
    expect(new Set(passwords).size).toBe(SEED_USERS.length);
    passwords.forEach((p) => {
      expect(p).not.toBe('1234');
      expect(p.length).toBeGreaterThanOrEqual(12);
    });
  });
});

describe('ensureAllSeedAccounts', () => {
  it('inserts missing seed roles (e.g. doctor, nurse) and unlocks never-logged-in seed accounts without touching active accounts', async () => {
    const existingByUsername = new Map([
      ['sysadmin', { id: 'usr-1', username: 'sysadmin', last_login_at: null, must_change_password: true }],
      ['admin', { id: 'usr-2', username: 'admin', last_login_at: '2026-10-15T10:00:00Z', must_change_password: false }],
    ]);
    const repo = {
      findByUsername: vi.fn(async (u) => existingByUsername.get(u) ?? null),
      insert: vi.fn(async () => {}),
      updatePassword: vi.fn(async () => {}),
    };

    const provisioned = await ensureAllSeedAccounts({
      userRepo: repo,
      hashPassword,
      defaultPassword: '1234',
      mustChangePassword: false,
    });

    // sysadmin was never logged into -> unlocked
    expect(repo.updatePassword).toHaveBeenCalledWith('usr-1', 'hash:1234');
    // admin already logged in -> untouched
    expect(repo.updatePassword).not.toHaveBeenCalledWith('usr-2', expect.anything());
    // 6 missing accounts (SF_1, SF_2, SF_3, supervisor, doctor, nurse) -> inserted
    expect(repo.insert).toHaveBeenCalledTimes(SEED_USERS.length - 2);
    expect(provisioned).toContainEqual({ username: 'sysadmin', action: 'unlocked' });
    expect(provisioned).toContainEqual({ username: 'doctor', action: 'inserted' });
    expect(provisioned).toContainEqual({ username: 'nurse', action: 'inserted' });
  });
});
