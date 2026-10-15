/**
 * industryProfileService.js — read/write industry profiles with server-side access control.
 * Hospital data is PDPA s.26 sensitive data: field-level rules + audit on every view/update.
 */
import { industryProfileSchema, zodIssuesToFieldErrors } from '../../shared/industrySchemas.js';
import {
  changedHospitalFields,
  findForbiddenNurseChanges,
  getMedicalAccess,
  redactHospitalProfile,
} from '../../shared/medicalAccessPolicy.js';

const parseStored = (data, kind) => {
  if (!data) return null;
  const result = industryProfileSchema.safeParse(data);
  if (!result.success || result.data.kind !== kind) {
    console.warn(`[Industry Profile] Stored ${kind} profile failed validation; ignoring`);
    return null;
  }
  return result.data;
};

/**
 * @param {{ repo: { get: Function, upsert: Function }, audit: (entry: object) => Promise<void> }} deps
 */
export const createIndustryProfileService = ({ repo, audit }) => {
  const auditMedical = (user, customerId, action, ip, details) =>
    audit({
      userId: user.username,
      userRole: user.role,
      action,
      category: 'data',
      resource: `Customer/${customerId}/hospital`,
      ip,
      details,
    });

  const getProfile = async (user, customerId, kind, ip) => {
    const profile = parseStored(await repo.get(customerId, kind), kind);
    if (kind !== 'hospital') return { status: 'ok', access: 'full', profile };

    const access = getMedicalAccess(user.role);
    if (access === 'redacted') {
      return { status: 'ok', access, profile: profile ? redactHospitalProfile(profile) : null };
    }
    if (profile) await auditMedical(user, customerId, 'MEDICAL_PROFILE_VIEW', ip, `access=${access}`);
    return { status: 'ok', access, profile };
  };

  const saveProfile = async (user, customerId, kind, input, ip) => {
    const parsed = industryProfileSchema.safeParse(input);
    if (!parsed.success) return { status: 'error', code: 'INVALID_PROFILE', errors: zodIssuesToFieldErrors(parsed.error) };
    const next = parsed.data;
    if (next.kind !== kind) return { status: 'error', code: 'KIND_MISMATCH' };

    if (kind === 'hospital') {
      const access = getMedicalAccess(user.role);
      if (access === 'redacted') {
        await auditMedical(user, customerId, 'MEDICAL_PROFILE_UPDATE_DENIED', ip, 'reason=no_medical_access');
        return { status: 'error', code: 'FORBIDDEN' };
      }
      const before = parseStored(await repo.get(customerId, kind), kind);
      if (access === 'nurse') {
        const forbidden = findForbiddenNurseChanges(before, next);
        if (forbidden.length > 0) {
          await auditMedical(user, customerId, 'MEDICAL_PROFILE_UPDATE_DENIED', ip, `fields=${forbidden.join(',')}`);
          return { status: 'error', code: 'FORBIDDEN_FIELDS', fields: forbidden };
        }
      }
      await repo.upsert(customerId, kind, next, user.id);
      // Field names only — never the medical values themselves.
      await auditMedical(user, customerId, 'MEDICAL_PROFILE_UPDATE', ip, `fields=${changedHospitalFields(before, next).join(',')}`);
      return { status: 'ok', profile: next };
    }

    await repo.upsert(customerId, kind, next, user.id);
    return { status: 'ok', profile: next };
  };

  return { getProfile, saveProfile };
};
