/**
 * medicalAccessPolicy.js — who may see / edit hospital (health) data. PDPA s.26 sensitive data.
 * Shared by the server (enforcement) and the frontend (UI hints). The server is the authority.
 *
 *   admin, doctor : full view + edit
 *   nurse         : full view; edit only allergies, emergency contact, insurance
 *   everyone else : redacted (HN + "has allergy" flag only)
 */

/** @typedef {'full' | 'nurse' | 'redacted'} MedicalAccess */

const FULL_ACCESS_ROLES = ['admin', 'doctor'];

export const HOSPITAL_FIELDS = /** @type {const} */ ([
  'hn',
  'bloodType',
  'drugAllergies',
  'chronicConditions',
  'insurancePolicies',
  'preferredDoctor',
  'emergencyContact',
]);

export const NURSE_EDITABLE_FIELDS = /** @type {const} */ (['drugAllergies', 'emergencyContact', 'insurancePolicies']);

/**
 * @param {string} role
 * @returns {MedicalAccess}
 */
export const getMedicalAccess = (role) => {
  if (FULL_ACCESS_ROLES.includes(role)) return 'full';
  if (role === 'nurse') return 'nurse';
  return 'redacted';
};

/** @param {{ hn: string, drugAllergies: string[] }} profile */
export const redactHospitalProfile = (profile) => ({
  kind: /** @type {const} */ ('hospital'),
  redacted: /** @type {const} */ (true),
  hn: profile.hn,
  hasDrugAllergy: profile.drugAllergies.length > 0,
});

/** Profiles compared here have both passed schema parsing, so key order is stable. */
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * @param {Record<string, unknown> | null} before
 * @param {Record<string, unknown>} after
 * @returns {string[]} hospital fields whose value changed
 */
export const changedHospitalFields = (before, after) =>
  HOSPITAL_FIELDS.filter((f) => !same(before?.[f], after[f]));

/**
 * @param {Record<string, unknown> | null} before
 * @param {Record<string, unknown>} after
 * @returns {string[]} fields a nurse changed but is not allowed to
 */
export const findForbiddenNurseChanges = (before, after) =>
  changedHospitalFields(before, after).filter((f) => !NURSE_EDITABLE_FIELDS.includes(f));
