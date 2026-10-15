import { HospitalProfile, InsurancePolicy } from '../../types/industryProfile';
import { ExpiryStatus, getExpiryStatus } from './dateRules';

export const hasDrugAllergy = (profile: HospitalProfile): boolean => profile.drugAllergies.length > 0;

/** 'unknown' means the policy has no expiry date recorded (common for SSO / UCS rights). */
export const getPolicyStatus = (policy: InsurancePolicy, today: Date): ExpiryStatus =>
  getExpiryStatus(policy.validUntil, today);
