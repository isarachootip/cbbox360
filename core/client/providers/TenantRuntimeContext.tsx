import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_ROLE_PERMISSIONS, matchPermission } from '../../shared/permissions.js';
import { useAuth } from '../../../src/context/AuthContext';
import { clientModuleRegistry } from '../registry/clientModuleRegistry';
import {
  getTenantSlugOverride,
  installTenantFetchInterceptor,
  setTenantSlugOverride,
} from '../api/tenantOverride';
import { TenantBranding, TenantRuntimeState } from './tenantRuntimeTypes';

export type {
  TenantBranding,
  TenantFieldDefinition,
  TenantCaseCategory,
  TenantRuntimeState,
} from './tenantRuntimeTypes';

installTenantFetchInterceptor();

const DEFAULT_RUNTIME: TenantRuntimeState = {
  tenantId: 'default',
  tenantSlug: 'default',
  tenantName: 'CusBox360',
  templateId: null,
  isControlPlane: false,
  branding: {
    appName: 'CusBox360',
    logoUrl: '/logo-full-transparent.png',
    iconUrl: '/logo-icon-transparent.png',
    primaryColor: '#6366F1',
    accentColor: '#4F46E5',
  },
  entitlements: { 'flag:ai_copilot': true, 'flag:voice_3cx': true, 'flag:pdpa_consent': true },
  labels: {},
  permissions: DEFAULT_ROLE_PERMISSIONS.sysadmin,
  contactFieldDefs: [],
  caseCategories: [],
  isLoaded: false,
};

const UNIFIED_BRAND_TOKENS = {
  brand: '99 102 241',
  hover: '79 70 229',
  deep: '67 56 202',
  tint: '238 240 255',
  selected: '242 241 255',
};

const applyCssBrandTokens = (branding: TenantBranding) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--cb-brand-rgb', UNIFIED_BRAND_TOKENS.brand);
  root.style.setProperty('--cb-brand-hover-rgb', UNIFIED_BRAND_TOKENS.hover);
  root.style.setProperty('--cb-brand-deep-rgb', UNIFIED_BRAND_TOKENS.deep);
  root.style.setProperty('--cb-brand-tint-rgb', UNIFIED_BRAND_TOKENS.tint);
  root.style.setProperty('--cb-brand-selected-rgb', UNIFIED_BRAND_TOKENS.selected);
  if (branding.appName) document.title = `${branding.appName} - Omnichannel CRM & Contact Center`;
};

interface TenantRuntimeContextValue extends TenantRuntimeState {
  activeOverrideSlug: string | null;
  isEntitled: (featureKey: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  tLabel: (key: string, fallback: string) => string;
  refreshRuntime: () => Promise<void>;
  switchTenantWorkspace: (slug: string | null) => Promise<void>;
}

const TenantRuntimeContext = createContext<TenantRuntimeContextValue | undefined>(undefined);

export const TenantRuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, refreshUsers } = useAuth();
  const [activeOverrideSlug, setActiveOverrideSlug] = useState<string | null>(() => getTenantSlugOverride());
  const [runtime, setRuntime] = useState<TenantRuntimeState>(() => ({
    ...DEFAULT_RUNTIME,
    entitlements: { ...DEFAULT_RUNTIME.entitlements, ...clientModuleRegistry.getDefaultFallbackEntitlements() },
  }));

  const loadBootstrap = async () => {
    try {
      const publicRes = await fetch('/api/public/branding');
      if (publicRes.ok) {
        const pub = await publicRes.json();
        if (pub?.isControlPlane === false) {
          setTenantSlugOverride(null);
          setActiveOverrideSlug(null);
        }
        if (pub?.branding) {
          applyCssBrandTokens(pub.branding);
          setRuntime((prev) => ({
            ...prev,
            tenantId: pub.tenantId || prev.tenantId,
            tenantSlug: pub.tenantSlug || prev.tenantSlug,
            tenantName: pub.tenantName || prev.tenantName,
            templateId: pub.templateId ?? prev.templateId,
            isControlPlane: Boolean(pub.isControlPlane),
            branding: { ...prev.branding, ...pub.branding },
          }));
        }
      }

      if (currentUser) {
        const bootRes = await fetch('/api/tenant/bootstrap', { credentials: 'include' });
        if (bootRes.ok) {
          const boot = await bootRes.json();
          if (boot?.isControlPlane === false) {
            setTenantSlugOverride(null);
            setActiveOverrideSlug(null);
          }
          if (boot?.branding) applyCssBrandTokens(boot.branding);
          setRuntime((prev) => ({
            ...prev,
            tenantId: boot.tenant?.id || prev.tenantId,
            tenantSlug: boot.tenant?.slug || prev.tenantSlug,
            tenantName: boot.tenant?.name || prev.tenantName,
            templateId: boot.tenant?.templateId ?? prev.templateId,
            isControlPlane: Boolean(boot.isControlPlane),
            branding: boot.branding ? { ...prev.branding, ...boot.branding } : prev.branding,
            entitlements: boot.entitlements || {},
            labels: boot.labels || {},
            permissions: boot.permissions || DEFAULT_ROLE_PERMISSIONS[currentUser.role] || [],
            contactFieldDefs: boot.contactFieldDefs || [],
            caseCategories: boot.caseCategories || [],
            isLoaded: true,
          }));
          void refreshUsers();
          return;
        }
      }
    } catch {
      // Offline / Vite standalone dev mode falls back cleanly to DEFAULT_RUNTIME
    }

    const fallbackPerms = currentUser?.role ? (DEFAULT_ROLE_PERMISSIONS[currentUser.role] ?? []) : [];
    setRuntime((prev) => ({ ...prev, permissions: fallbackPerms, isLoaded: true }));
  };

  useEffect(() => {
    void loadBootstrap();
  }, [currentUser?.id, currentUser?.role]);

  const switchTenantWorkspace = async (slug: string | null) => {
    setTenantSlugOverride(slug);
    setActiveOverrideSlug(slug);
    await loadBootstrap();
  };

  return (
    <TenantRuntimeContext.Provider
      value={{
        ...runtime,
        activeOverrideSlug,
        isEntitled: (key) => Boolean(runtime.entitlements[key]),
        hasPermission: (code) => matchPermission(runtime.permissions, code),
        tLabel: (key, fallback) => runtime.labels[key] || fallback,
        refreshRuntime: loadBootstrap,
        switchTenantWorkspace,
      }}
    >
      {children}
    </TenantRuntimeContext.Provider>
  );
};

export const useTenantRuntime = (): TenantRuntimeContextValue => {
  const ctx = useContext(TenantRuntimeContext);
  if (!ctx) throw new Error('useTenantRuntime must be used inside TenantRuntimeProvider');
  return ctx;
};
