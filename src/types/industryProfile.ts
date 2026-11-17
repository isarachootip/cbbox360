import { z } from 'zod';
import {
  autoServiceProfileSchema,
  contactCenterProfileSchema,
  hospitalProfileSchema,
  industryProfileSchema,
  insurancePolicySchema,
  logisticsProfileSchema,
  redactedHospitalProfileSchema,
  vehicleSchema,
} from '../domain/industry/schemas';

/** Types are inferred from the Zod schemas so runtime validation and compile-time types stay in sync. */
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;
export type HospitalProfile = z.infer<typeof hospitalProfileSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type AutoServiceProfile = z.infer<typeof autoServiceProfileSchema>;
export type LogisticsProfile = z.infer<typeof logisticsProfileSchema>;
export type ContactCenterProfile = z.infer<typeof contactCenterProfileSchema>;
export type IndustryProfile = z.infer<typeof industryProfileSchema>;

export type IndustryKind = IndustryProfile['kind'];
export type CoverageType = InsurancePolicy['coverageType'];
export type BloodType = HospitalProfile['bloodType'];
export type LogisticsServiceType = LogisticsProfile['defaultService'];
export type ContactCenterSlaTier = ContactCenterProfile['slaTier'];
export type ContactPreferredChannel = ContactCenterProfile['preferredChannel'];
export type ContactPreferredLanguage = ContactCenterProfile['preferredLanguage'];
export type RedactedHospitalProfile = z.infer<typeof redactedHospitalProfileSchema>;

/** Mirrors shared/medicalAccessPolicy.js (the server is the authority). */
export type MedicalAccess = 'full' | 'nurse' | 'redacted';
