import { Router } from 'express';
import { env } from '../config/env.js';
import { createAuthController } from '../controllers/authController.js';
import { authService, requireSession } from '../services/authContainer.js';
import { writeAuditLog } from '../services/auditService.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import { parseCookies, SESSION_COOKIE } from '../utils/cookies.js';

const router = Router();

const ctrl = createAuthController({
  authService,
  audit: writeAuditLog,
  cookieSecure: env.NODE_ENV === 'production',
  sessionTtlHours: env.SESSION_TTL_HOURS,
});

// Per-IP limit complements the per-account lockout (credential stuffing across many accounts).
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });

/** Reads the session cookie into req[field] for routes that don't require a full session. */
const withCookieToken = (field) => (req, _res, next) => {
  req[field] = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  next();
};

router.post('/login', authLimiter, ctrl.login);
router.post('/totp/verify', authLimiter, withCookieToken('pendingToken'), ctrl.verifyTotp);
router.get('/me', requireSession, ctrl.me);
router.post('/logout', withCookieToken('sessionToken'), ctrl.logout);
router.post('/change-password', requireSession, ctrl.changePassword);

export default router;
