import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService, MAX_FAILED_ATTEMPTS } from './authService.js';
import { generateTotpCodeServer } from '../utils/totpServer.js';

const NOW = new Date('2026-10-15T10:00:00Z');

/** In-memory fakes so tests don't need PostgreSQL. */
const createFakes = () => {
  const users = new Map();
  const sessions = new Map();
  const userRepo = {
    findByUsername: async (u) => [...users.values()].find((x) => x.username.toLowerCase() === u.toLowerCase()) ?? null,
    findById: async (id) => users.get(id) ?? null,
    recordFailedLogin: async (id, lockedUntil) => {
      const u = users.get(id);
      u.failed_attempts += 1;
      u.locked_until = lockedUntil;
    },
    recordSuccessfulLogin: async (id) => {
      const u = users.get(id);
      u.failed_attempts = 0;
      u.locked_until = null;
    },
    updatePassword: async (id, hash) => {
      const u = users.get(id);
      u.password_hash = hash;
      u.must_change_password = false;
    },
  };
  const sessionRepo = {
    create: async (s) => sessions.set(s.id, { ...s }),
    findById: async (id) => sessions.get(id) ?? null,
    delete: async (id) => sessions.delete(id),
    deleteByUserExcept: async (userId, keepId) => {
      [...sessions.values()].filter((s) => s.userId === userId && s.id !== keepId).forEach((s) => sessions.delete(s.id));
    },
  };
  return { users, sessions, userRepo, sessionRepo };
};

const baseUser = {
  id: 'usr-2',
  username: 'admin',
  display_name: 'อนุชา',
  email: 'admin@cb360.co.th',
  role: 'admin',
  department: 'IT',
  initials: 'AD',
  avatar_bg: '#CFE2F8',
  password_hash: 'hash:correct-password',
  must_change_password: false,
  is_active: true,
  totp_enabled: false,
  totp_secret_encrypted: null,
  failed_attempts: 0,
  locked_until: null,
};

let fakes;
let auth;

beforeEach(() => {
  fakes = createFakes();
  fakes.users.set(baseUser.id, { ...baseUser });
  auth = createAuthService({
    userRepo: fakes.userRepo,
    sessionRepo: fakes.sessionRepo,
    hashPassword: async (p) => `hash:${p}`,
    verifyPassword: async (hash, p) => hash === `hash:${p}`,
    decryptSecret: (s) => s,
    now: () => NOW,
    sessionTtlHours: 8,
  });
});

describe('login', () => {
  it('creates an authenticated session and never stores the raw token', async () => {
    const result = await auth.login({ username: 'ADMIN', password: 'correct-password' });
    expect(result.status).toBe('ok');
    expect(result.user).toMatchObject({ id: 'usr-2', role: 'admin' });
    expect(result.user).not.toHaveProperty('password_hash');
    const [stored] = [...fakes.sessions.values()];
    expect(stored.id).not.toBe(result.token);
    expect(stored.authStage).toBe('AUTHENTICATED');
    expect(await auth.getAuthenticatedUser(result.token)).toMatchObject({ id: 'usr-2' });
  });

  it('returns the same generic error for unknown user and wrong password', async () => {
    const unknown = await auth.login({ username: 'ghost', password: 'x' });
    const wrong = await auth.login({ username: 'admin', password: 'nope' });
    expect(unknown).toEqual({ status: 'error', code: 'INVALID_CREDENTIALS' });
    expect(wrong).toEqual({ status: 'error', code: 'INVALID_CREDENTIALS' });
  });

  it(`locks the account after ${MAX_FAILED_ATTEMPTS} failed attempts, even with the right password`, async () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await auth.login({ username: 'admin', password: 'nope' });
    }
    const result = await auth.login({ username: 'admin', password: 'correct-password' });
    expect(result).toMatchObject({ status: 'error', code: 'ACCOUNT_LOCKED' });
  });

  it('rejects disabled accounts only after a correct password', async () => {
    fakes.users.get('usr-2').is_active = false;
    expect(await auth.login({ username: 'admin', password: 'nope' })).toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(await auth.login({ username: 'admin', password: 'correct-password' })).toMatchObject({ code: 'ACCOUNT_DISABLED' });
  });
});

describe('two-factor login', () => {
  const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

  beforeEach(() => {
    Object.assign(fakes.users.get('usr-2'), { totp_enabled: true, totp_secret_encrypted: SECRET });
  });

  it('requires TOTP and the pending token cannot access the API', async () => {
    const result = await auth.login({ username: 'admin', password: 'correct-password' });
    expect(result.status).toBe('totp_required');
    expect(await auth.getAuthenticatedUser(result.token)).toBeNull();
  });

  it('issues a NEW session token after a valid code (prevents session fixation)', async () => {
    const pending = await auth.login({ username: 'admin', password: 'correct-password' });
    const code = generateTotpCodeServer(SECRET, NOW.getTime());
    const result = await auth.verifyLoginTotp(pending.token, code);
    expect(result.status).toBe('ok');
    expect(result.token).not.toBe(pending.token);
    expect(await auth.getAuthenticatedUser(pending.token)).toBeNull();
    expect(await auth.getAuthenticatedUser(result.token)).toMatchObject({ id: 'usr-2' });
  });

  it('rejects a wrong code and counts it as a failed attempt', async () => {
    const pending = await auth.login({ username: 'admin', password: 'correct-password' });
    const result = await auth.verifyLoginTotp(pending.token, '000000');
    expect(result).toMatchObject({ status: 'error', code: 'INVALID_TOTP' });
    expect(fakes.users.get('usr-2').failed_attempts).toBe(1);
  });
});

describe('sessions', () => {
  it('expires sessions after the TTL', async () => {
    const { token } = await auth.login({ username: 'admin', password: 'correct-password' });
    const later = createAuthService({
      userRepo: fakes.userRepo,
      sessionRepo: fakes.sessionRepo,
      hashPassword: async (p) => `hash:${p}`,
      verifyPassword: async (h, p) => h === `hash:${p}`,
      decryptSecret: (s) => s,
      now: () => new Date(NOW.getTime() + 9 * 3600_000),
      sessionTtlHours: 8,
    });
    expect(await later.getAuthenticatedUser(token)).toBeNull();
  });

  it('rejects forged tokens and logs out', async () => {
    expect(await auth.getAuthenticatedUser('forged-token')).toBeNull();
    const { token } = await auth.login({ username: 'admin', password: 'correct-password' });
    await auth.logout(token);
    expect(await auth.getAuthenticatedUser(token)).toBeNull();
  });

  it('rejects sessions of users disabled after login', async () => {
    const { token } = await auth.login({ username: 'admin', password: 'correct-password' });
    fakes.users.get('usr-2').is_active = false;
    expect(await auth.getAuthenticatedUser(token)).toBeNull();
  });
});

describe('changePassword', () => {
  it('requires the current password, enforces length, and revokes other sessions', async () => {
    const first = await auth.login({ username: 'admin', password: 'correct-password' });
    const second = await auth.login({ username: 'admin', password: 'correct-password' });
    expect(await auth.changePassword('usr-2', 'wrong', 'new-password-123', second.token)).toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(await auth.changePassword('usr-2', 'correct-password', 'short', second.token)).toMatchObject({ code: 'WEAK_PASSWORD' });
    expect(await auth.changePassword('usr-2', 'correct-password', 'new-password-123', second.token)).toEqual({ status: 'ok' });
    expect(await auth.getAuthenticatedUser(first.token)).toBeNull();
    expect(await auth.getAuthenticatedUser(second.token)).toMatchObject({ id: 'usr-2' });
  });
});
