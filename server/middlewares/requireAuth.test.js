import { describe, it, expect, vi } from 'vitest';
import { parseCookies, serializeSessionCookie, serializeClearedCookie, SESSION_COOKIE } from '../utils/cookies.js';
import { createAuthMiddleware } from './requireAuth.js';

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

describe('cookies', () => {
  it('parses multiple cookies and decodes values', () => {
    expect(parseCookies('a=1; cb360_session=abc%3D; theme=dark')).toEqual({ a: '1', cb360_session: 'abc=', theme: 'dark' });
    expect(parseCookies(undefined)).toEqual({});
  });

  it('serializes an httpOnly, SameSite=Lax session cookie (Secure in production)', () => {
    const dev = serializeSessionCookie('tok', { maxAgeSeconds: 60, secure: false });
    expect(dev).toContain(`${SESSION_COOKIE}=tok`);
    expect(dev).toContain('HttpOnly');
    expect(dev).toContain('SameSite=Lax');
    expect(dev).toContain('Max-Age=60');
    expect(dev).not.toContain('Secure');
    expect(serializeSessionCookie('tok', { maxAgeSeconds: 60, secure: true })).toContain('Secure');
    expect(serializeClearedCookie({ secure: false })).toContain('Max-Age=0');
  });
});

describe('auth middleware', () => {
  const user = { id: 'u1', role: 'nurse', mustChangePassword: false };
  const authService = { getAuthenticatedUser: vi.fn(async (t) => (t === 'good' ? user : t === 'pending' ? { ...user, mustChangePassword: true } : null)) };
  const { requireAuth, requireSession, requireRole } = createAuthMiddleware(authService);

  it('returns 401 without a valid session cookie', async () => {
    const res = mockRes();
    const next = vi.fn();
    await requireAuth({ headers: { cookie: `${SESSION_COOKIE}=bad` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches req.user for a valid session', async () => {
    const req = { headers: { cookie: `${SESSION_COOKIE}=good` } };
    const next = vi.fn();
    await requireAuth(req, mockRes(), next);
    expect(req.user).toEqual(user);
    expect(req.sessionToken).toBe('good');
    expect(next).toHaveBeenCalled();
  });

  it('blocks normal routes until a required password change is done', async () => {
    const res = mockRes();
    await requireAuth({ headers: { cookie: `${SESSION_COOKIE}=pending` } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'PASSWORD_CHANGE_REQUIRED' }));

    const next = vi.fn();
    await requireSession({ headers: { cookie: `${SESSION_COOKIE}=pending` } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole allows listed roles and returns 403 otherwise', () => {
    const next = vi.fn();
    requireRole('nurse', 'doctor')({ user }, mockRes(), next);
    expect(next).toHaveBeenCalled();
    const res = mockRes();
    requireRole('admin')({ user }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
