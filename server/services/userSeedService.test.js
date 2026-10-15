import { describe, it, expect, vi } from 'vitest';
import { ensureSeedUsers, SEED_USERS } from './userSeedService.js';

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
