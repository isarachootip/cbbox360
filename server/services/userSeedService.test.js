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
  const makeSeedRepo = (existing) => {
    const byUsername = new Map(existing.map((u) => [u.username, u]));
    return {
      findByUsername: vi.fn(async (u) => byUsername.get(u) ?? null),
      insert: vi.fn(async () => {}),
      resetPassword: vi.fn(async () => {}),
      updatePassword: vi.fn(async () => {}),
    };
  };

  it('inserts missing roles (doctor, nurse), resets never-logged-in accounts, and leaves active accounts untouched', async () => {
    const repo = makeSeedRepo([
      { id: 'usr-1', username: 'sysadmin', last_login_at: null, must_change_password: true, password_hash: 'x' },
      { id: 'usr-2', username: 'admin', last_login_at: '2026-10-15T10:00:00Z', must_change_password: false, password_hash: 'y' },
    ]);

    const provisioned = await ensureAllSeedAccounts({ userRepo: repo, hashPassword, defaultPassword: 'chosen-pass' });

    expect(repo.resetPassword).toHaveBeenCalledWith('usr-1', 'hash:chosen-pass');
    expect(repo.resetPassword).not.toHaveBeenCalledWith('usr-2', expect.anything());
    expect(repo.updatePassword).not.toHaveBeenCalled();
    expect(repo.insert).toHaveBeenCalledTimes(SEED_USERS.length - 2);
    expect(provisioned).toContainEqual({ username: 'sysadmin', action: 'reset' });
    expect(provisioned).toContainEqual({ username: 'doctor', action: 'inserted' });
    expect(provisioned).toContainEqual({ username: 'nurse', action: 'inserted' });
  });

  it('always forces a password change on first login for inserted accounts', async () => {
    const repo = makeSeedRepo([]);
    await ensureAllSeedAccounts({ userRepo: repo, hashPassword, defaultPassword: 'chosen-pass' });
    repo.insert.mock.calls.forEach(([u]) => expect(u.mustChangePassword).toBe(true));
  });

  it('randomizePasswords: unique random password per account, never the shared default', async () => {
    const repo = makeSeedRepo([]);
    const provisioned = await ensureAllSeedAccounts({
      userRepo: repo, hashPassword, defaultPassword: '1234', randomizePasswords: true,
    });
    const passwords = provisioned.map((p) => p.temporaryPassword);
    expect(new Set(passwords).size).toBe(SEED_USERS.length);
    passwords.forEach((p) => {
      expect(p).not.toBe('1234');
      expect(p.length).toBeGreaterThanOrEqual(12);
    });
  });

  it('recovers accounts whose hash was created by the removed argon2 implementation', async () => {
    const repo = makeSeedRepo([
      { id: 'usr-2', username: 'admin', last_login_at: '2026-10-15T10:00:00Z', must_change_password: false, password_hash: '$argon2id$v=19$abc' },
    ]);
    const provisioned = await ensureAllSeedAccounts({ userRepo: repo, hashPassword, defaultPassword: 'chosen-pass' });
    expect(repo.resetPassword).toHaveBeenCalledWith('usr-2', 'hash:chosen-pass');
    expect(provisioned).toContainEqual({ username: 'admin', action: 'reset' });
  });
});

