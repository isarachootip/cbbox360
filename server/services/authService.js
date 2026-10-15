/**
 * authService.js
 * Server-side authentication: password login, account lockout, TOTP second factor,
 * session lifecycle and password change. Dependencies are injected for testability.
 */
import { generateSessionToken, hashSessionToken } from '../utils/cryptoUtils.js';
import { verifyTotpCodeServer } from '../utils/totpServer.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const TOTP_PENDING_MINUTES = 5;
export const MIN_PASSWORD_LENGTH = 8;

const STAGE_AUTHENTICATED = 'AUTHENTICATED';
const STAGE_TOTP_PENDING = 'TOTP_PENDING';

// Used when the username does not exist so response time doesn't reveal valid usernames.
const DUMMY_HASH = 'hash:__no_such_user__';

const error = (code, extra = {}) => ({ status: 'error', code, ...extra });

/** Never expose hashes, secrets or lockout counters to the client. */
export const toPublicUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.display_name,
  email: u.email ?? '',
  role: u.role,
  department: u.department ?? '',
  initials: u.initials ?? u.display_name.slice(0, 2),
  avatarBg: u.avatar_bg ?? '#CFE2F8',
  mustChangePassword: Boolean(u.must_change_password),
  totpEnabled: Boolean(u.totp_enabled),
});

/**
 * @param {{
 *   userRepo: object, sessionRepo: object,
 *   hashPassword: (p: string) => Promise<string>,
 *   verifyPassword: (hash: string, p: string) => Promise<boolean>,
 *   decryptSecret: (s: string) => string | null,
 *   getDummyHash?: () => Promise<string>,
 *   now?: () => Date, sessionTtlHours: number
 * }} deps
 */
export const createAuthService = (deps) => {
  const { userRepo, sessionRepo, hashPassword, verifyPassword, decryptSecret, sessionTtlHours } = deps;
  const now = deps.now ?? (() => new Date());
  const getDummyHash = deps.getDummyHash ?? (async () => DUMMY_HASH);
  const addMinutes = (minutes) => new Date(now().getTime() + minutes * 60_000);

  const createSession = async (userId, authStage, meta, ttlMinutes) => {
    const token = generateSessionToken();
    await sessionRepo.create({
      id: hashSessionToken(token),
      userId,
      authStage,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt: addMinutes(ttlMinutes),
    });
    return token;
  };

  const registerFailure = async (user) => {
    const attempts = user.failed_attempts + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? addMinutes(LOCK_MINUTES) : null;
    await userRepo.recordFailedLogin(user.id, lockedUntil);
  };

  const findLiveSession = async (token, stage) => {
    if (!token) return null;
    const session = await sessionRepo.findById(hashSessionToken(token));
    if (!session || session.authStage !== stage) return null;
    if (new Date(session.expiresAt).getTime() <= now().getTime()) {
      await sessionRepo.delete(session.id);
      return null;
    }
    return session;
  };

  const login = async ({ username, password, ip, userAgent }) => {
    const user = await userRepo.findByUsername(String(username).trim());
    if (!user) {
      await verifyPassword(await getDummyHash(), password);
      return error('INVALID_CREDENTIALS');
    }
    if (user.locked_until && new Date(user.locked_until) > now()) {
      return error('ACCOUNT_LOCKED', { lockedUntil: new Date(user.locked_until).toISOString() });
    }
    if (!(await verifyPassword(user.password_hash, password))) {
      await registerFailure(user);
      return error('INVALID_CREDENTIALS');
    }
    if (!user.is_active) return error('ACCOUNT_DISABLED');

    await userRepo.recordSuccessfulLogin(user.id, now());
    const meta = { ip, userAgent };
    if (user.totp_enabled && user.totp_secret_encrypted) {
      const token = await createSession(user.id, STAGE_TOTP_PENDING, meta, TOTP_PENDING_MINUTES);
      return { status: 'totp_required', token };
    }
    const token = await createSession(user.id, STAGE_AUTHENTICATED, meta, sessionTtlHours * 60);
    return { status: 'ok', token, user: toPublicUser(user) };
  };

  const verifyLoginTotp = async (pendingToken, code, meta = {}) => {
    const session = await findLiveSession(pendingToken, STAGE_TOTP_PENDING);
    if (!session) return error('SESSION_EXPIRED');
    const user = await userRepo.findById(session.userId);
    if (!user || !user.is_active) return error('SESSION_EXPIRED');

    const secret = decryptSecret(user.totp_secret_encrypted);
    if (!secret || !verifyTotpCodeServer(code, secret, 1, now().getTime())) {
      await registerFailure(user);
      return error('INVALID_TOTP');
    }
    // Rotate: the pre-2FA token must never become a fully authenticated session.
    await sessionRepo.delete(session.id);
    const token = await createSession(user.id, STAGE_AUTHENTICATED, meta, sessionTtlHours * 60);
    return { status: 'ok', token, user: toPublicUser(user) };
  };

  const getAuthenticatedUser = async (token) => {
    const session = await findLiveSession(token, STAGE_AUTHENTICATED);
    if (!session) return null;
    const user = await userRepo.findById(session.userId);
    if (!user || !user.is_active) return null;
    return toPublicUser(user);
  };

  const logout = async (token) => {
    if (token) await sessionRepo.delete(hashSessionToken(token));
  };

  const changePassword = async (userId, currentPassword, newPassword, currentToken) => {
    const user = await userRepo.findById(userId);
    if (!user || !(await verifyPassword(user.password_hash, currentPassword))) {
      return error('INVALID_CREDENTIALS');
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword === currentPassword) {
      return error('WEAK_PASSWORD', { minLength: MIN_PASSWORD_LENGTH });
    }
    await userRepo.updatePassword(userId, await hashPassword(newPassword));
    await sessionRepo.deleteByUserExcept(userId, currentToken ? hashSessionToken(currentToken) : null);
    return { status: 'ok' };
  };

  return { login, verifyLoginTotp, getAuthenticatedUser, logout, changePassword };
};
