/**
 * industryProfileService.js — Pluggable profile storage service with policy extension hooks.
 * Contains zero industry-specific if/else branches; domain modules register access policies by kind.
 */
import { industryProfileSchema, zodIssuesToFieldErrors } from '../../shared/industrySchemas.js';
import { hospitalProfileAccessPolicy } from '../../modules/patient-profile/policy.js';

const globalPolicies = new Map([[hospitalProfileAccessPolicy.kind, hospitalProfileAccessPolicy]]);

export const registerProfileAccessPolicy = (policy) => {
  if (policy?.kind) globalPolicies.set(policy.kind, policy);
};

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
 * @param {{ repo: { get: Function, upsert: Function }, audit: (entry: object) => Promise<void>, policies?: Map<string, object> }} deps
 */
export const createIndustryProfileService = ({ repo, audit, policies = globalPolicies }) => {
  const getProfile = async (user, customerId, kind, ip) => {
    const profile = parseStored(await repo.get(customerId, kind), kind);
    const policy = policies.get(kind);
    if (policy?.onRead) {
      return policy.onRead({ user, customerId, profile, ip, audit });
    }
    return { status: 'ok', access: 'full', profile };
  };

  const saveProfile = async (user, customerId, kind, input, ip) => {
    const parsed = industryProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        status: 'error',
        code: 'INVALID_PROFILE',
        errors: zodIssuesToFieldErrors(parsed.error),
      };
    }
    const next = parsed.data;
    if (next.kind !== kind) return { status: 'error', code: 'KIND_MISMATCH' };

    const policy = policies.get(kind);
    if (policy?.onWrite) {
      const before = parseStored(await repo.get(customerId, kind), kind);
      return policy.onWrite({ user, customerId, before, next, ip, repo, audit });
    }

    await repo.upsert(customerId, kind, next, user.id);
    return { status: 'ok', profile: next };
  };

  return { getProfile, saveProfile };
};
