import { z } from 'zod';
import { BusinessTemplateId, DeploymentMode } from '../../types';
import { EMPTY_ADDED_RESOURCES, TemplateAddedResources } from './templateMerge';
import { BusinessMenuOverrides } from './businessMenuFilter';

export const BUSINESS_TEMPLATE_STORAGE_KEY = 'cb360_business_template_state';

export const templateIdSchema = z.enum([
  'consumer_finance',
  'contact_center',
  'support_fix',
  'hospital',
  'logistics',
  'auto_service',
  'b2b_wholesale',
]);

const roleSchema = z.enum([
  'sysadmin',
  'admin',
  'SF_1',
  'SF_2',
  'SF_3',
  'supervisor',
  'doctor',
  'nurse',
]);

const deploymentModeSchema = z.enum(['demo', 'production_locked']);

const menuOverrideEntrySchema = z.object({
  enabled: z.array(z.string()),
  disabled: z.array(z.string()),
});

const storedStateSchema = z.object({
  activeTemplateId: templateIdSchema,
  deploymentMode: deploymentModeSchema.optional(),
  appliedTemplateIds: z.array(templateIdSchema),
  lastAppliedAt: z.string().optional(),
  menuOverrides: z
    .object({
      consumer_finance: menuOverrideEntrySchema.optional(),
      contact_center: menuOverrideEntrySchema.optional(),
      support_fix: menuOverrideEntrySchema.optional(),
      hospital: menuOverrideEntrySchema.optional(),
      logistics: menuOverrideEntrySchema.optional(),
      auto_service: menuOverrideEntrySchema.optional(),
      b2b_wholesale: menuOverrideEntrySchema.optional(),
    })
    .optional(),
  addedResources: z
    .object({
      connectorIds: z.array(z.string()),
      cannedResponseIds: z.array(z.string()),
      ruleIds: z.array(z.string()),
      menuGrants: z.array(z.object({ menuId: z.string(), role: roleSchema })),
      knowledgeItemIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export interface BusinessTemplateState {
  activeTemplateId: BusinessTemplateId;
  deploymentMode: DeploymentMode;
  appliedTemplateIds: BusinessTemplateId[];
  lastAppliedAt?: string;
  addedResources: TemplateAddedResources;
  menuOverrides: BusinessMenuOverrides;
}

export const DEFAULT_BUSINESS_TEMPLATE_STATE: BusinessTemplateState = {
  activeTemplateId: 'b2b_wholesale',
  deploymentMode: 'demo',
  appliedTemplateIds: ['b2b_wholesale'],
  addedResources: EMPTY_ADDED_RESOURCES,
  menuOverrides: {},
};

export const isBusinessTemplateId = (val: string | null | undefined): val is BusinessTemplateId =>
  Boolean(val && templateIdSchema.safeParse(val).success);

export const loadBusinessTemplateState = (): BusinessTemplateState => {
  try {
    const raw = localStorage.getItem(BUSINESS_TEMPLATE_STORAGE_KEY);
    if (!raw) return DEFAULT_BUSINESS_TEMPLATE_STATE;
    const result = storedStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) return DEFAULT_BUSINESS_TEMPLATE_STATE;
    return {
      ...result.data,
      deploymentMode: result.data.deploymentMode ?? 'demo',
      addedResources: result.data.addedResources ?? EMPTY_ADDED_RESOURCES,
      menuOverrides: result.data.menuOverrides ?? {},
    };
  } catch (e) {
    console.warn('Failed to load business template state', e);
    return DEFAULT_BUSINESS_TEMPLATE_STATE;
  }
};

export const saveBusinessTemplateState = (state: BusinessTemplateState): void => {
  try {
    localStorage.setItem(BUSINESS_TEMPLATE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save business template state', e);
  }
};
