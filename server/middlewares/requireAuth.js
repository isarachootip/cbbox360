/**
 * requireAuth.js — session authentication & role authorisation middleware.
 */
import { parseCookies, SESSION_COOKIE } from '../utils/cookies.js';

/**
 * @param {{ getAuthenticatedUser: (token: string) => Promise<object | null> }} authService
 */
export const createAuthMiddleware = (authService) => {
  const authenticate = (allowPendingPasswordChange) => async (req, res, next) => {
    const token = parseCookies(req.headers?.cookie)[SESSION_COOKIE];
    const user = token ? await authService.getAuthenticatedUser(token) : null;
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
    }
    if (user.mustChangePassword && !allowPendingPasswordChange) {
      return res.status(403).json({ success: false, error: 'PASSWORD_CHANGE_REQUIRED' });
    }
    req.user = user;
    req.sessionToken = token;
    return next();
  };

  /** Normal protected routes. */
  const requireAuth = authenticate(false);

  /** Only for /auth/me, /auth/change-password, /auth/logout (usable while a password change is pending). */
  const requireSession = authenticate(true);

  /** Must run after requireAuth. */
  const requireRole =
    (...roles) =>
    (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN' });
      }
      return next();
    };

  return { requireAuth, requireSession, requireRole };
};
