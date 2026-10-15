import React, { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import { BusinessTemplateId } from '../types';
import {
  EMPTY_ADDED_RESOURCES,
  TemplateAddedResources,
  mergeAddedResources,
} from '../domain/templates/templateMerge';

const STORAGE_KEY = 'cb360_business_template_state';

const templateIdSchema = z.enum(['hospital', 'logistics', 'auto_service', 'b2b_wholesale']);
const roleSchema = z.enum(['sysadmin', 'admin', 'SF_1', 'SF_2', 'SF_3', 'supervisor', 'doctor', 'nurse']);

const storedStateSchema = z.object({
  activeTemplateId: templateIdSchema,
  appliedTemplateIds: z.array(templateIdSchema),
  lastAppliedAt: z.string().optional(),
  // Optional: state saved by Phase 1 did not track added resources.
  addedResources: z
    .object({
      connectorIds: z.array(z.string()),
      cannedResponseIds: z.array(z.string()),
      ruleIds: z.array(z.string()),
      menuGrants: z.array(z.object({ menuId: z.string(), role: roleSchema })),
    })
    .optional(),
});

export interface BusinessTemplateState {
  activeTemplateId: BusinessTemplateId;
  appliedTemplateIds: BusinessTemplateId[];
  lastAppliedAt?: string;
  addedResources: TemplateAddedResources;
}

const DEFAULT_STATE: BusinessTemplateState = {
  activeTemplateId: 'b2b_wholesale',
  appliedTemplateIds: ['b2b_wholesale'],
  addedResources: EMPTY_ADDED_RESOURCES,
};

const loadState = (): BusinessTemplateState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const result = storedStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) return DEFAULT_STATE;
    return { ...result.data, addedResources: result.data.addedResources ?? EMPTY_ADDED_RESOURCES };
  } catch (e) {
    console.warn('Failed to load business template state', e);
    return DEFAULT_STATE;
  }
};

interface BusinessTemplateContextType {
  state: BusinessTemplateState;
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

  const recordApplied = (templateId: BusinessTemplateId, added: TemplateAddedResources) => {
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setState((prev) => ({
      activeTemplateId: templateId,
      appliedTemplateIds: Array.from(new Set([...prev.appliedTemplateIds, templateId])),
      lastAppliedAt: `วันนี้ ${time} น.`,
      addedResources: mergeAddedResources(prev.addedResources, added),
    }));
  };

  const resetState = () => setState(DEFAULT_STATE);

  return (
    <BusinessTemplateContext.Provider value={{ state, recordApplied, resetState }}>
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
