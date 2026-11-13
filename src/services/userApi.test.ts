import { describe, it, expect, vi, afterEach } from 'vitest';
import { userApi } from './userApi';

const sampleUser = {
  id: 'usr-tumtum',
  username: 'tumtum',
  name: 'Tumtum',
  email: 'tumtum@cb360.co.th',
  role: 'admin' as const,
  department: 'Operations & IT',
  initials: 'TT',
  avatarBg: '#CFE2F8',
  status: 'active' as const,
  mustChangePassword: false,
  totpEnabled: false,
  createdAt: '2026-11-12',
  lastLoginAt: null,
};

const mockFetch = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.unstubAllGlobals());

describe('userApi', () => {
  it('list returns validated managed users', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, users: [sampleUser] }));
    expect(await userApi.list()).toEqual({ status: 'ok', users: [sampleUser] });
  });

  it('create returns the newly created user on 201', async () => {
    vi.stubGlobal('fetch', mockFetch(201, { success: true, user: sampleUser }));
    const res = await userApi.create({
      username: 'tumtum',
      password: '1234',
      name: 'Tumtum',
      email: 'tumtum@cb360.co.th',
      role: 'admin',
      department: 'Operations & IT',
      status: 'active',
    });
    expect(res).toEqual({ status: 'ok', user: sampleUser });
  });

  it('maps USERNAME_TAKEN error code from 409', async () => {
    vi.stubGlobal('fetch', mockFetch(409, { success: false, error: 'USERNAME_TAKEN' }));
    const res = await userApi.create({
      username: 'tumtum',
      password: '1234',
      name: 'Tumtum',
      email: '',
      role: 'SF_1',
      department: 'Sales',
      status: 'active',
    });
    expect(res).toEqual({ status: 'error', code: 'USERNAME_TAKEN' });
  });

  it('rejects malformed server payload with BAD_RESPONSE', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true, users: [{ ...sampleUser, role: 'invalid' }] }));
    expect(await userApi.list()).toEqual({ status: 'error', code: 'BAD_RESPONSE' });
  });

  it('handles network failure with NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await userApi.resetPassword('usr-1', { newPassword: '1234' })).toEqual({
      status: 'error',
      code: 'NETWORK_ERROR',
    });
  });

  it('validates agent skills and 3CX extension fields when returned by server', async () => {
    const telAgent = { ...sampleUser, username: 'tel_agent1', skills: ['telephone' as const], extension: '101' };
    vi.stubGlobal('fetch', mockFetch(200, { success: true, users: [telAgent] }));
    expect(await userApi.list()).toEqual({ status: 'ok', users: [telAgent] });
  });
});
