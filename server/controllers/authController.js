/**
 * authController.js — HTTP layer for login, 2FA, session and password change.
 */
import { z } from 'zod';
import { serializeClearedCookie, serializeSessionCookie } from '../utils/cookies.js';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
});
const totpSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
});

const STATUS_BY_CODE = {
  INVALID_CREDENTIALS: 401,
  INVALID_TOTP: 401,
  SESSION_EXPIRED: 401,
  ACCOUNT_DISABLED: 403,
  ACCOUNT_LOCKED: 423,
  WEAK_PASSWORD: 400,
};

const TOTP_PENDING_SECONDS = 5 * 60;

export const createAuthController = ({ authService, audit, cookieSecure, sessionTtlHours }) => {
  const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });
  const setCookie = (res, token, maxAgeSeconds) =>
    res.setHeader('Set-Cookie', serializeSessionCookie(token, { maxAgeSeconds, secure: cookieSecure }));
  const fail = (res, result) => res.status(STATUS_BY_CODE[result.code] ?? 400).json({ success: false, error: result.code, ...result });

  /** Wraps a handler so infrastructure errors fail closed (503) instead of leaking details. */
  const safe = (handler) => async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      console.error('[Auth Error]:', err.message);
      return res.status(503).json({ success: false, error: 'AUTH_UNAVAILABLE' });
    }
  };

  const login = safe(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const { username, password } = parsed.data;
    const result = await authService.login({ username, password, ...meta(req) });

    if (result.status === 'ok') {
      setCookie(res, result.token, sessionTtlHours * 3600);
      await audit({ userId: result.user.username, userRole: result.user.role, action: 'AUTH_LOGIN_SUCCESS', category: 'security', resource: 'Auth/Login', ip: req.ip });
      return res.status(200).json({ success: true, user: result.user });
    }
    if (result.status === 'totp_required') {
      setCookie(res, result.token, TOTP_PENDING_SECONDS);
      return res.status(200).json({ success: false, requireTwoFactor: true });
    }
    await audit({ userId: username, action: `AUTH_LOGIN_${result.code}`, category: 'security', resource: 'Auth/Login', ip: req.ip, status: 'failure' });
    return fail(res, result);
  });

  const verifyTotp = safe(async (req, res) => {
    const parsed = totpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await authService.verifyLoginTotp(req.pendingToken, parsed.data.code, meta(req));
    if (result.status !== 'ok') {
      await audit({ userId: 'unknown', action: `AUTH_2FA_${result.code}`, category: 'security', resource: 'Auth/2FA', ip: req.ip, status: 'failure' });
      return fail(res, result);
    }
    setCookie(res, result.token, sessionTtlHours * 3600);
    await audit({ userId: result.user.username, userRole: result.user.role, action: 'AUTH_2FA_SUCCESS', category: 'security', resource: 'Auth/2FA', ip: req.ip });
    return res.status(200).json({ success: true, user: result.user });
  });

  const me = (req, res) => res.status(200).json({ success: true, user: req.user });

  const logout = safe(async (req, res) => {
    await authService.logout(req.sessionToken);
    res.setHeader('Set-Cookie', serializeClearedCookie({ secure: cookieSecure }));
    return res.status(200).json({ success: true });
  });

  const changePassword = safe(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const { currentPassword, newPassword } = parsed.data;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword, req.sessionToken);
    if (result.status !== 'ok') return fail(res, result);
    await audit({ userId: req.user.username, userRole: req.user.role, action: 'AUTH_PASSWORD_CHANGED', category: 'security', resource: 'Auth/Password', ip: req.ip });
    return res.status(200).json({ success: true });
  });

  return { login, verifyTotp, me, logout, changePassword };
};
