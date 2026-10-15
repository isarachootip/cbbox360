import { z } from 'zod';

/**
 * Re-exports the shared schemas (shared/industrySchemas.js) so the frontend and the server
 * validate profiles with exactly the same rules.
 */
export {
  VIN_PATTERN,
  INDUSTRY_KINDS,
  industryKindSchema,
  insurancePolicySchema,
  hospitalProfileSchema,
  redactedHospitalProfileSchema,
  vehicleSchema,
  autoServiceProfileSchema,
  logisticsProfileSchema,
  industryProfileSchema,
} from '../../../shared/industrySchemas.js';

export interface FieldError {
  path: string;
  message: string;
}

export const toFieldErrors = (error: z.ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
