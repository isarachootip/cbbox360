import React, { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import { BusinessTemplateId, DeploymentMode, UserRole } from '../types';
import {
  EMPTY_ADDED_RESOURCES,
  TemplateAddedResources,
  mergeAddedResources,
} from '../domain/templates/templateMerge';
import {
  BusinessMenuOverrides,
  toggleBusinessMenuOverride,
} from '../domain/templates/businessMenuFilter';

const STORAGE_KEY = 'cb360_business_template_state';

const templateIdSchema = z.enum([
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

const DEFAULT_STATE: BusinessTemplateState = {
  activeTemplateId: 'b2b_wholesale',
  deploymentMode: 'demo',
  appliedTemplateIds: ['b2b_wholesale'],
  addedResources: EMPTY_ADDED_RESOURCES,
  menuOverrides: {},
};

const loadState = (): BusinessTemplateState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const result = storedStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) return DEFAULT_STATE;
    return {
      ...result.data,
      deploymentMode: result.data.deploymentMode ?? 'demo',
      addedResources: result.data.addedResources ?? EMPTY_ADDED_RESOURCES,
      menuOverrides: result.data.menuOverrides ?? {},
    };
  } catch (e) {
    console.warn('Failed to load business template state', e);
    return DEFAULT_STATE;
  }
};

interface BusinessTemplateContextType {
  state: BusinessTemplateState;
  switchBusiness: (templateId: BusinessTemplateId) => boolean;
  setDeploymentMode: (mode: DeploymentMode, actorRole?: UserRole) => boolean;
  setMenuOverride: (menuId: string, shouldShow: boolean) => void;
  recordApplied: (templateId: BusinessTemplateId, added: TemplateAddedResources) => void;
  resetState: () => void;
}

const BusinessTemplateContext = createContext<BusinessTemplateContextType | undefined>(undefined);

export const BusinessTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BusinessTemplateState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save business template state', e);
    }
  }, [state]);

  const nowTime = () =>
    `วันนี้ ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

  const switchBusiness = (templateId: BusinessTemplateId): boolean => {
    if (state.deploymentMode === 'production_locked') return false;
    setState((prev) => ({
      ...prev,
      activeTemplateId: templateId,
      appliedTemplateIds: Array.from(new Set([...prev.appliedTemplateIds, templateId])),
      lastAppliedAt: nowTime(),
    }));
    return true;
  };

  const setDeploymentMode = (mode: DeploymentMode, actorRole?: UserRole): boolean => {
    if (actorRole !== 'sysadmin') return false;
    setState((prev) => ({ ...prev, deploymentMode: mode, lastAppliedAt: nowTime() }));
    return true;
  };

  const setMenuOverride = (menuId: string, shouldShow: boolean) => {
    setState((prev) => ({
      ...prev,
      menuOverrides: toggleBusinessMenuOverride(
        prev.menuOverrides,
        prev.activeTemplateId,
        menuId,
        shouldShow
      ),
    }));
  };

  const recordApplied = (templateId: BusinessTemplateId, added: TemplateAddedResources) => {
    setState((prev) => ({
      ...prev,
      activeTemplateId: templateId,
      appliedTemplateIds: Array.from(new Set([...prev.appliedTemplateIds, templateId])),
      lastAppliedAt: nowTime(),
      addedResources: mergeAddedResources(prev.addedResources, added),
    }));
  };

  const resetState = () => {
    if (state.deploymentMode === 'production_locked') return;
    setState(DEFAULT_STATE);
  };

  return (
    <BusinessTemplateContext.Provider
      value={{
        state,
        switchBusiness,
        setDeploymentMode,
        setMenuOverride,
        recordApplied,
        resetState,
      }}
    >
      {children}
    </BusinessTemplateContext.Provider>
  );
};

export const useBusinessTemplateState = (): BusinessTemplateContextType => {
  const context = useContext(BusinessTemplateContext);
  if (!context) {
    throw new Error('useBusinessTemplateState must be used within a BusinessTemplateProvider');
  }
  return context;
};
