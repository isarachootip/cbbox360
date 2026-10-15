import { describe, it, expect, vi, afterEach } from 'vitest';
import { authApi } from './authApi';

const user = {
  id: 'usr-7', username: 'doctor', name: 'นพ. ก', email: 'd@x', role: 'doctor', department: 'Medical',
  initials: 'กพ', avatarBg: '#fff', mustChangePassword: true, totpEnabled: false,
};

const mockFetch = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.unstubAllGlobals());

describe('authApi', () => {
  it('login returns a validated user on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, user }));
    expect(await authApi.login('doctor', 'pw')).toEqual({ status: 'ok', user });
  });

  it('login reports the 2FA step', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: false, requireTwoFactor: true }));
    expect(await authApi.login('doctor', 'pw')).toEqual({ status: 'totp_required' });
  });

  it('maps server error codes (e.g. lockout)', async () => {
    vi.stubGlobal('fetch', mockFetch(423, { success: false, error: 'ACCOUNT_LOCKED', lockedUntil: '2026-10-15T10:15:00Z' }));
    expect(await authApi.login('doctor', 'pw')).toEqual({ status: 'error', code: 'ACCOUNT_LOCKED', lockedUntil: '2026-10-15T10:15:00Z' });
  });

  it('rejects a response whose user does not match the schema (e.g. unknown role)', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, user: { ...user, role: 'superuser' } }));
    expect(await authApi.login('doctor', 'pw')).toEqual({ status: 'error', code: 'BAD_RESPONSE' });
  });

  it('reports NETWORK_ERROR when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    expect(await authApi.login('doctor', 'pw')).toEqual({ status: 'error', code: 'NETWORK_ERROR' });
  });

  it('me returns null when not logged in', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { success: false, error: 'UNAUTHENTICATED' }));
    expect(await authApi.me()).toBeNull();
  });
});
