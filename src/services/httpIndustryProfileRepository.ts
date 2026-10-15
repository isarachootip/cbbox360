import { z } from 'zod';
import {
  FieldError,
  industryProfileSchema,
  redactedHospitalProfileSchema,
  toFieldErrors,
} from '../domain/industry/schemas';
import { IndustryProfile } from '../types/industryProfile';
import { IndustryProfileRepository, LoadedProfile } from './industryProfileRepository';

/** Server-backed repository (server auth mode). Access control is enforced by the API. */

const accessSchema = z.enum(['full', 'nurse', 'redacted']);
const getResponseSchema = z.object({ access: accessSchema, profile: z.unknown() });
const errorBodySchema = z.object({
  error: z.string().optional(),
  fields: z.array(z.string()).optional(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

const ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'บัญชีของคุณไม่มีสิทธิ์แก้ไขข้อมูลการแพทย์',
  KIND_MISMATCH: 'ประเภทข้อมูลไม่ตรงกับเทมเพลต',
  UNAUTHENTICATED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  PASSWORD_CHANGE_REQUIRED: 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน',
};
const LOAD_ERROR = 'ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้';

const url = (customerId: string, kind: string) =>
  `/api/customers/${encodeURIComponent(customerId)}/industry-profile/${kind}`;

const call = async (input: string, init?: RequestInit) => {
  try {
    const res = await fetch(input, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...init });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as unknown };
  } catch {
    return null;
  }
};

const toSaveErrors = (body: unknown): FieldError[] => {
  const parsed = errorBodySchema.safeParse(body);
  if (!parsed.success) return [{ path: '', message: 'บันทึกไม่สำเร็จ' }];
  const { error, fields, errors } = parsed.data;
  if (error === 'FORBIDDEN_FIELDS' && fields) {
    return [{ path: fields.join(','), message: `ตำแหน่งของคุณแก้ไขช่องเหล่านี้ไม่ได้: ${fields.join(', ')}` }];
  }
  if (errors && errors.length > 0) return errors;
  return [{ path: '', message: (error && ERROR_MESSAGES[error]) ?? 'บันทึกไม่สำเร็จ' }];
};

export const createHttpIndustryProfileRepository = (): IndustryProfileRepository => ({
  async get(customerId, kind): Promise<LoadedProfile> {
    const res = await call(url(customerId, kind));
    const parsed = res?.status === 200 ? getResponseSchema.safeParse(res.body) : null;
    if (!parsed?.success) return { access: 'redacted', profile: null, redacted: null, error: LOAD_ERROR };

    const { access, profile } = parsed.data;
    if (profile === null) return { access, profile: null, redacted: null };
    if (access === 'redacted') {
      const redacted = redactedHospitalProfileSchema.safeParse(profile);
      return redacted.success
        ? { access, profile: null, redacted: redacted.data }
        : { access, profile: null, redacted: null, error: LOAD_ERROR };
    }
    const full = industryProfileSchema.safeParse(profile);
    return full.success
      ? { access, profile: full.data, redacted: null }
      : { access, profile: null, redacted: null, error: LOAD_ERROR };
  },

  async save(customerId, profile: IndustryProfile) {
    // Validate locally first for instant feedback; the server validates again.
    const local = industryProfileSchema.safeParse(profile);
    if (!local.success) return { ok: false, errors: toFieldErrors(local.error) };

    const res = await call(url(customerId, local.data.kind), { method: 'PUT', body: JSON.stringify({ profile: local.data }) });
    if (!res) return { ok: false, errors: [{ path: '', message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }] };
    if (res.status !== 200) return { ok: false, errors: toSaveErrors(res.body) };

    const saved = z.object({ profile: industryProfileSchema }).safeParse(res.body);
    return saved.success
      ? { ok: true, profile: saved.data.profile }
      : { ok: false, errors: [{ path: '', message: 'เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง' }] };
  },
});
