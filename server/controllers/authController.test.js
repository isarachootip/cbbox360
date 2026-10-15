import { describe, it, expect, vi } from 'vitest';
import { createAuthController } from './authController.js';

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const req = (body = {}, extra = {}) => ({ body, headers: { 'user-agent': 'vitest' }, ip: '127.0.0.1', ...extra });

const build = (authService) =>
  createAuthController({ authService, audit: vi.fn(async () => {}), cookieSecure: false, sessionTtlHours: 8 });

describe('authController.login', () => {
  it('400 on malformed body', async () => {
    const res = mockRes();
    await build({}).login(req({ username: '' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sets the session cookie and returns the user on success', async () => {
    const res = mockRes();
    const ctrl = build({ login: vi.fn(async () => ({ status: 'ok', token: 'tok', user: { id: 'u', username: 'admin', role: 'admin' } })) });
    await ctrl.login(req({ username: 'admin', password: 'pw' }), res);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('cb360_session=tok'));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, user: expect.objectContaining({ id: 'u' }) }));
  });

  it('maps lockout to 423 and bad credentials to 401 without setting a cookie', async () => {
    const locked = mockRes();
    await build({ login: async () => ({ status: 'error', code: 'ACCOUNT_LOCKED', lockedUntil: 'x' }) }).login(req({ username: 'a', password: 'b' }), locked);
    expect(locked.status).toHaveBeenCalledWith(423);

    const bad = mockRes();
    await build({ login: async () => ({ status: 'error', code: 'INVALID_CREDENTIALS' }) }).login(req({ username: 'a', password: 'b' }), bad);
    expect(bad.status).toHaveBeenCalledWith(401);
    expect(bad.setHeader).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the database is unavailable', async () => {
    const res = mockRes();
    await build({ login: async () => { throw new Error('ECONNREFUSED'); } }).login(req({ username: 'a', password: 'b' }), res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
