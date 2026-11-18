import type { z } from 'zod';
import type { TenantFieldDefinition } from '../client/providers/TenantRuntimeContext';

export declare function buildDynamicZodSchema(
  defs: TenantFieldDefinition[]
): z.ZodObject<Record<string, z.ZodType>>;

export declare function extractCustomFieldTemplateVariables(
  defs: TenantFieldDefinition[],
  values: Record<string, unknown>
): Record<string, string>;
