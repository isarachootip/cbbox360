import { z } from 'zod';
import { AgentSkill, UserRole } from '../types';

/** Typed client for /api/users with Zod response validation. */

export const managedUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['sysadmin', 'admin', 'SF_1', 'SF_2', 'SF_3', 'supervisor', 'doctor', 'nurse']),
  department: z.string(),
  skills: z.array(z.enum(['telephone', 'line_chat_shop'])).optional(),
  extension: z.string().optional(),
  initials: z.string(),
  avatarBg: z.string(),
  status: z.enum(['active', 'inactive']),
  mustChangePassword: z.boolean(),
  totpEnabled: z.boolean(),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
});
export type ManagedServerUser = z.infer<typeof managedUserSchema>;

export type UserApiErrorCode =
  | 'USER_NOT_FOUND'
  | 'USERNAME_TAKEN'
  | 'FORBIDDEN_ROLE'
  | 'CANNOT_DISABLE_SELF'
  | 'CANNOT_DELETE_SELF'
  | 'LAST_SYSADMIN'
  | 'INVALID_TOTP'
  | 'INVALID_INPUT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'USER_SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'BAD_RESPONSE';

export type UserApiError = { status: 'error'; code: UserApiErrorCode };
export type UserListResult = { status: 'ok'; users: ManagedServerUser[] } | UserApiError;
export type SingleUserResult = { status: 'ok'; user: ManagedServerUser } | UserApiError;
export type EmptyUserResult = { status: 'ok' } | UserApiError;
export type SyncOperatorsResult =
  | { status: 'ok'; createdUsernames: string[]; users: ManagedServerUser[] }
  | UserApiError;

export interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: UserRole;
  department?: string;
  skills?: AgentSkill[];
  extension?: string;
  status?: 'active' | 'inactive';
  avatarBg?: string;
  mustChangePassword?: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  skills?: AgentSkill[];
  extension?: string;
  status?: 'active' | 'inactive';
  avatarBg?: string;
}

const KNOWN_CODES: UserApiErrorCode[] = [
  'USER_NOT_FOUND', 'USERNAME_TAKEN', 'FORBIDDEN_ROLE', 'CANNOT_DISABLE_SELF',
  'CANNOT_DELETE_SELF', 'LAST_SYSADMIN', 'INVALID_TOTP', 'INVALID_INPUT',
  'UNAUTHENTICATED', 'FORBIDDEN', 'USER_SERVICE_UNAVAILABLE',
];

const errorSchema = z.object({ error: z.string().optional() });

const request = async (path: string, init?: RequestInit): Promise<{ status: number; body: unknown } | null> => {
  try {
    const res = await fetch(`/api/users${path}`, {
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

const toError = (body: unknown): UserApiError => {
  const parsed = errorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error : undefined;
  const known = KNOWN_CODES.find((c) => c === code);
  return { status: 'error', code: known ?? 'BAD_RESPONSE' };
};

const parseOne = (body: unknown): SingleUserResult => {
  const parsed = z.object({ user: managedUserSchema }).safeParse(body);
  return parsed.success ? { status: 'ok', user: parsed.data.user } : { status: 'error', code: 'BAD_RESPONSE' };
};

export const userApi = {
  async list(): Promise<UserListResult> {
    const res = await request('');
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z.object({ users: z.array(managedUserSchema) }).safeParse(res.body);
    return parsed.success ? { status: 'ok', users: parsed.data.users } : { status: 'error', code: 'BAD_RESPONSE' };
  },

  async create(payload: CreateUserPayload): Promise<SingleUserResult> {
    const res = await request('', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 201 || res.status === 200 ? parseOne(res.body) : toError(res.body);
  },

  async update(id: string, payload: UpdateUserPayload): Promise<SingleUserResult> {
    const res = await request(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? parseOne(res.body) : toError(res.body);
  },

  async resetPassword(id: string, payload: { newPassword: string; mustChangePassword?: boolean }): Promise<EmptyUserResult> {
    const res = await request(`/${encodeURIComponent(id)}/reset-password`, { method: 'POST', body: JSON.stringify(payload) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? { status: 'ok' } : toError(res.body);
  },

  async setStatus(id: string, status: 'active' | 'inactive'): Promise<SingleUserResult> {
    const res = await request(`/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? parseOne(res.body) : toError(res.body);
  },

  async configureTotp(id: string, payload: { enabled: boolean; secret?: string; code?: string }): Promise<SingleUserResult> {
    const res = await request(`/${encodeURIComponent(id)}/totp`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? parseOne(res.body) : toError(res.body);
  },

  async remove(id: string): Promise<EmptyUserResult> {
    const res = await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    return res.status === 200 ? { status: 'ok' } : toError(res.body);
  },

  async syncOperators(): Promise<SyncOperatorsResult> {
    const res = await request('/sync-operators', { method: 'POST', body: JSON.stringify({}) });
    if (!res) return { status: 'error', code: 'NETWORK_ERROR' };
    if (res.status !== 200) return toError(res.body);
    const parsed = z
      .object({ createdUsernames: z.array(z.string()), users: z.array(managedUserSchema) })
      .safeParse(res.body);
    return parsed.success
      ? { status: 'ok', createdUsernames: parsed.data.createdUsernames, users: parsed.data.users }
      : { status: 'error', code: 'BAD_RESPONSE' };
  },
};

export const USER_ERROR_MESSAGES: Record<UserApiErrorCode, string> = {
  USER_NOT_FOUND: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ',
  USERNAME_TAKEN: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น',
  FORBIDDEN_ROLE: 'ไม่มีสิทธิ์สร้างหรือแก้ไขบัญชีระดับ System Administrator',
  CANNOT_DISABLE_SELF: 'ไม่สามารถระงับการใช้งานบัญชีของตัวเองได้',
  CANNOT_DELETE_SELF: 'ไม่สามารถลบบัญชีที่กำลังเข้าสู่ระบบอยู่ได้',
  LAST_SYSADMIN: 'ต้องมี System Administrator ที่เปิดใช้งานอย่างน้อย 1 บัญชีในระบบ',
  INVALID_TOTP: 'รหัสยืนยัน 6 หลักไม่ถูกต้อง กรุณาลองใหม่',
  INVALID_INPUT: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง',
  UNAUTHENTICATED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN: 'บัญชีของคุณไม่มีสิทธิ์จัดการผู้ใช้งาน',
  USER_SERVICE_UNAVAILABLE: 'ระบบจัดการผู้ใช้ไม่พร้อมใช้งานชั่วคราว',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
  BAD_RESPONSE: 'เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง',
};
