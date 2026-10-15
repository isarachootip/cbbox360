import { z } from 'zod';
import {
  autoServiceProfileSchema,
  hospitalProfileSchema,
  industryProfileSchema,
  insurancePolicySchema,
  logisticsProfileSchema,
  vehicleSchema,
} from '../domain/industry/schemas';

/** Types are inferred from the Zod schemas so runtime validation and compile-time types stay in sync. */
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;
export type HospitalProfile = z.infer<typeof hospitalProfileSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type AutoServiceProfile = z.infer<typeof autoServiceProfileSchema>;
export type LogisticsProfile = z.infer<typeof logisticsProfileSchema>;
export type IndustryProfile = z.infer<typeof industryProfileSchema>;

export type IndustryKind = IndustryProfile['kind'];
export type CoverageType = InsurancePolicy['coverageType'];
export type BloodType = HospitalProfile['bloodType'];
export type LogisticsServiceType = LogisticsProfile['defaultService'];
