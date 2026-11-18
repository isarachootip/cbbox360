import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_ROLE_PERMISSIONS, matchPermission } from '../../shared/permissions.js';
import { useAuth } from '../../../src/context/AuthContext';
import { clientModuleRegistry } from '../registry/clientModuleRegistry';

export interface TenantBranding {
  appName: string;
  logoUrl: string;
  iconUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor?: string;
}

export interface TenantFieldDefinition {
  id: string;
  entityType: string;
  key: string;
  label: string;
  type:
    | 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'datetime'
    | 'boolean' | 'select' | 'multiselect' | 'tags' | 'phone' | 'email' | 'object_list';
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    unique?: boolean;
    regex?: string;
    regexError?: string;
    min?: number;
    max?: number;
  };
  sensitivity?: 'normal' | 'pii' | 'pdpa_s26';
  ui?: {
    group?: string;
    order?: number;
    showInList?: boolean;
    variableKey?: string;
    alertBanner?: {
      whenNonEmpty: boolean;
      severity: 'info' | 'warning' | 'danger';
      prefix: string;
      redactedMessage?: string;
    };
  };
}

export interface TenantCaseCategory {
  slug: string;
  name: string;
  defaultQueue?: string;
}

export interface TenantRuntimeState {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  branding: TenantBranding;
  entitlements: Record<string, boolean>;
  labels: Record<string, string>;
  permissions: string[];
  contactFieldDefs: TenantFieldDefinition[];
  caseCategories: TenantCaseCategory[];
  isLoaded: boolean;
}

const DEFAULT_RUNTIME: TenantRuntimeState = {
  tenantId: 'default',
  tenantSlug: 'default',
  tenantName: 'CusBox360',
  branding: {
    appName: 'CusBox360',
    logoUrl: '/logo-full-transparent.png',
    iconUrl: '/logo-icon-transparent.png',
    primaryColor: '#1F6FD1',
    accentColor: '#1558B0',
  },
  entitlements: {
    'flag:ai_copilot': true,
    'flag:voice_3cx': true,
    'flag:pdpa_consent': true,
  },
  labels: {},
  permissions: DEFAULT_ROLE_PERMISSIONS.sysadmin,
  contactFieldDefs: [],
  caseCategories: [],
  isLoaded: false,
};

const hexToRgbTriplet = (hex: string): string | null => {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

const applyCssBrandTokens = (branding: TenantBranding) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const primaryRgb = hexToRgbTriplet(branding.primaryColor);
  if (primaryRgb) root.style.setProperty('--cb-brand-rgb', primaryRgb);
  if (branding.accentColor) {
    const hoverRgb = hexToRgbTriplet(branding.accentColor);
    if (hoverRgb) root.style.setProperty('--cb-brand-hover-rgb', hoverRgb);
  }
  if (branding.appName) {
    document.title = `${branding.appName} - Omnichannel CRM & Contact Center`;
  }
};

interface TenantRuntimeContextValue extends TenantRuntimeState {
  isEntitled: (featureKey: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  tLabel: (key: string, fallback: string) => string;
  refreshRuntime: () => Promise<void>;
}

const TenantRuntimeContext = createContext<TenantRuntimeContextValue | undefined>(undefined);

export const TenantRuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [runtime, setRuntime] = useState<TenantRuntimeState>(() => ({
    ...DEFAULT_RUNTIME,
    entitlements: {
      ...DEFAULT_RUNTIME.entitlements,
      ...clientModuleRegistry.getDefaultFallbackEntitlements(),
    },
  }));

  const loadBootstrap = async () => {
    try {
      const publicRes = await fetch('/api/public/branding');
      if (publicRes.ok) {
        const pub = await publicRes.json();
        if (pub?.branding) {
          applyCssBrandTokens(pub.branding);
          setRuntime((prev) => ({
            ...prev,
            tenantId: pub.tenantId || prev.tenantId,
            tenantSlug: pub.tenantSlug || prev.tenantSlug,
            tenantName: pub.tenantName || prev.tenantName,
            branding: { ...prev.branding, ...pub.branding },
          }));
        }
      }

      if (currentUser) {
        const bootRes = await fetch('/api/tenant/bootstrap', { credentials: 'include' });
        if (bootRes.ok) {
          const boot = await bootRes.json();
          if (boot?.branding) applyCssBrandTokens(boot.branding);
          setRuntime((prev) => ({
            ...prev,
            tenantId: boot.tenant?.id || prev.tenantId,
            tenantSlug: boot.tenant?.slug || prev.tenantSlug,
            tenantName: boot.tenant?.name || prev.tenantName,
            branding: boot.branding ? { ...prev.branding, ...boot.branding } : prev.branding,
            entitlements: boot.entitlements || prev.entitlements,
            labels: boot.labels || prev.labels,
            permissions: boot.permissions || DEFAULT_ROLE_PERMISSIONS[currentUser.role] || [],
            contactFieldDefs: boot.contactFieldDefs || [],
            caseCategories: boot.caseCategories || [],
            isLoaded: true,
          }));
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

  const isEntitled = (featureKey: string): boolean => Boolean(runtime.entitlements[featureKey]);
  const hasPermission = (code: string): boolean => matchPermission(runtime.permissions, code);
  const tLabel = (key: string, fallback: string): string => runtime.labels[key] || fallback;

  return (
    <TenantRuntimeContext.Provider
      value={{ ...runtime, isEntitled, hasPermission, tLabel, refreshRuntime: loadBootstrap }}
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
