/**
 * modules/patient-profile/policy.js — Hospital PDPA s.26 Medical Access Policy Extension.
 * Extracted out of Core so `industryProfileService` uses a pluggable policy map with zero industry if/else.
 */
import { registerDefaultRolePreset } from '../../core/shared/permissions.js';
import {
  changedHospitalFields,
  findForbiddenNurseChanges,
  getMedicalAccess,
  redactHospitalProfile,
} from '../../shared/medicalAccessPolicy.js';

registerDefaultRolePreset('doctor', [
  'contact:read',
  'contact:write',
  'contact.pii:read',
  'contact.pdpa_s26:read',
  'contact.pdpa_s26:write',
  'case:read',
  'case:write',
  'appointment:read',
  'appointment:write',
]);

registerDefaultRolePreset('nurse', [
  'contact:read',
  'contact.pii:read',
  'contact.pdpa_s26:read',
  'contact.allergy:write',
  'case:read',
  'case:write',
  'appointment:read',
  'appointment:write',
]);

export const hospitalProfileAccessPolicy = {
  kind: 'hospital',

  async onRead({ user, customerId, profile, ip, audit }) {
    const access = getMedicalAccess(user?.role);
    if (access === 'redacted') {
      return { status: 'ok', access, profile: profile ? redactHospitalProfile(profile) : null };
    }
    if (profile) {
      await audit({
        userId: user.username,
        userRole: user.role,
        action: 'MEDICAL_PROFILE_VIEW',
        category: 'data',
        resource: `Customer/${customerId}/hospital`,
        ip,
        details: `access=${access}`,
      });
    }
    return { status: 'ok', access, profile };
  },

  async onWrite({ user, customerId, before, next, ip, repo, audit }) {
    const access = getMedicalAccess(user?.role);
    if (access === 'redacted') {
      await audit({
        userId: user.username,
        userRole: user.role,
        action: 'MEDICAL_PROFILE_UPDATE_DENIED',
        category: 'data',
        resource: `Customer/${customerId}/hospital`,
        ip,
        details: 'reason=no_medical_access',
      });
      return { status: 'error', code: 'FORBIDDEN' };
    }

    if (access === 'nurse') {
      const forbidden = findForbiddenNurseChanges(before, next);
      if (forbidden.length > 0) {
        await audit({
          userId: user.username,
          userRole: user.role,
          action: 'MEDICAL_PROFILE_UPDATE_DENIED',
          category: 'data',
          resource: `Customer/${customerId}/hospital`,
          ip,
          details: `fields=${forbidden.join(',')}`,
        });
        return { status: 'error', code: 'FORBIDDEN_FIELDS', fields: forbidden };
      }
    }

    await repo.upsert(customerId, 'hospital', next, user.id);
    await audit({
      userId: user.username,
      userRole: user.role,
      action: 'MEDICAL_PROFILE_UPDATE',
      category: 'data',
      resource: `Customer/${customerId}/hospital`,
      ip,
      details: `fields=${changedHospitalFields(before, next).join(',')}`,
    });
    return { status: 'ok', profile: next };
  },
};
