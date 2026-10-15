import { z } from 'zod';

/** Typed client for /api/auth. Every response is validated before use. */

export const serverUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['sysadmin', 'admin', 'SF_1', 'SF_2', 'SF_3', 'supervisor', 'doctor', 'nurse']),
  department: z.string(),
  initials: z.string(),
  avatarBg: z.string(),
  mustChangePassword: z.boolean(),
  totpEnabled: z.boolean(),
});
export type ServerUser = z.infer<typeof serverUserSchema>;

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_DISABLED' | 'INVALID_TOTP' | 'SESSION_EXPIRED'
  | 'WEAK_PASSWORD' | 'TOO_MANY_REQUESTS' | 'AUTH_UNAVAILABLE' | 'INVALID_INPUT'
  | 'NETWORK_ERROR' | 'BAD_RESPONSE';

export type AuthError = { status: 'error'; code: AuthErrorCode; lockedUntil?: string };
export type LoginResult = { status: 'ok'; user: ServerUser } | { status: 'totp_required' } | AuthError;
export type UserResult = { status: 'ok'; user: ServerUser } | AuthError;
export type SimpleResult = { status: 'ok' } | AuthError;

const KNOWN_CODES: AuthErrorCode[] = [
  'INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'ACCOUNT_DISABLED', 'INVALID_TOTP', 'SESSION_EXPIRED',
  'WEAK_PASSWORD', 'TOO_MANY_REQUESTS', 'AUTH_UNAVAILABLE', 'INVALID_INPUT',
];

const errorBodySchema = z.object({ error: z.string().optional(), lockedUntil: z.string().optional() });

const request = async (path: string, init?: RequestInit): Promise<{ status: number; body: unknown } | null> => {
  try {
    const res = await fetch(`/api/auth${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const body: unknown = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } catch {
    return null;
  }
};

const toError = (body: unknown): AuthError => {
  const parsed = errorBodySchema.safeParse(body);
  const code = parsed.success ? parsed.data.error : undefined;
  const known = KNOWN_CODES.find((c) => c === code);
  if (!known) return { status: 'error', code: 'BAD_RESPONSE' };
  return parsed.success && parsed.data.lockedUntil
    ? { status: 'error', code: known, lockedUntil: parsed.data.lockedUntil }
    : { status: 'error', code: known };
};

const parseUser = (body: unknown): UserResult => {
  const parsed = z.object({ user: serverUserSchema }).safeParse(body);
  return parsed.success ? { status: 'ok', user: parsed.data.user } : { status: 'error', code: 'BAD_RESPONSE' };
};

const post = (path: string, payload: object) => request(path, { method: 'POST', body: JSON.stringify(payload) });

export const authApi = {
  async login(username: string, password: string): Promise<LoginResult> {
    const res = await post('/login', { username, password });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    if (z.object({ requireTwoFactor: z.literal(true) }).safeParse(res.body).success) return { status: 'totp_required' };
    return parseUser(res.body);
  },

  async verifyTotp(code: string): Promise<UserResult> {
    const res = await post('/totp/verify', { code });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? parseUser(res.body) : toError(res.body);
  },

  /** Returns null when there is no valid session (or the server is unreachable). */
  async me(): Promise<ServerUser | null> {
    const res = await request('/me');
    if (!res || res.status !== 200) return null;
    const result = parseUser(res.body);
    return result.status === 'ok' ? result.user : null;
  },

  async logout(): Promise<void> {
    await post('/logout', {});
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<SimpleResult> {
    const res = await post('/change-password', { currentPassword, newPassword });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? { status: 'ok' } : toError(res.body);
  },
};

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  ACCOUNT_LOCKED: 'บัญชีถูกล็อกชั่วคราวเนื่องจากใส่รหัสผิดหลายครั้ง กรุณาลองใหม่ภายหลัง',
  ACCOUNT_DISABLED: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
  INVALID_TOTP: 'รหัสยืนยันตัวตนไม่ถูกต้อง หรือหมดเวลา',
  SESSION_EXPIRED: 'หมดเวลาการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่',
  WEAK_PASSWORD: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร และต้องไม่ซ้ำรหัสเดิม',
  TOO_MANY_REQUESTS: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่',
  AUTH_UNAVAILABLE: 'ระบบยืนยันตัวตนไม่พร้อมใช้งานชั่วคราว',
  INVALID_INPUT: 'ข้อมูลไม่ถูกต้อง',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
  BAD_RESPONSE: 'เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง',
};
