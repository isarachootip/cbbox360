import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BusinessTemplateId, DeploymentMode, UserRole } from '../types';
import { TemplateAddedResources, mergeAddedResources } from '../domain/templates/templateMerge';
import { toggleBusinessMenuOverride } from '../domain/templates/businessMenuFilter';
import {
  BusinessTemplateState,
  DEFAULT_BUSINESS_TEMPLATE_STATE,
  isBusinessTemplateId,
  loadBusinessTemplateState,
  saveBusinessTemplateState,
} from '../domain/templates/businessTemplateStorage';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

export type { BusinessTemplateState };

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
  const { tenantId, templateId: tenantTemplateId } = useTenantRuntime();
  const [state, setState] = useState<BusinessTemplateState>(loadBusinessTemplateState);
  const lastSyncedTenantKeyRef = useRef<string>('default::');

  useEffect(() => {
    saveBusinessTemplateState(state);
  }, [state]);

  const nowTime = () =>
    `วันนี้ ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

  useEffect(() => {
    const syncKey = `${tenantId}::${tenantTemplateId ?? ''}`;
    if (lastSyncedTenantKeyRef.current === syncKey) return;
    const prevWasTenant = !lastSyncedTenantKeyRef.current.startsWith('default::');
    lastSyncedTenantKeyRef.current = syncKey;

    if (tenantId !== 'default' && isBusinessTemplateId(tenantTemplateId)) {
      setState((prev) => ({
        ...prev,
        activeTemplateId: tenantTemplateId,
        appliedTemplateIds: Array.from(new Set([...prev.appliedTemplateIds, tenantTemplateId])),
        lastAppliedAt: nowTime(),
      }));
    } else if (tenantId === 'default' && prevWasTenant) {
      setState((prev) => ({
        ...prev,
        activeTemplateId: 'b2b_wholesale',
        lastAppliedAt: nowTime(),
      }));
    }
  }, [tenantId, tenantTemplateId]);

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
    setState(DEFAULT_BUSINESS_TEMPLATE_STATE);
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
