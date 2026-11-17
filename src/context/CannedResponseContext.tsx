import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BusinessTemplateId, CannedResponse, CompanyProfile } from '../types';
import { mockCannedResponses } from '../data/cannedResponses';
import { businessTemplates } from '../data/businessTemplates';
import { CATEGORIES_CONFIG, CannedCategoryConfig } from '../data/cannedCategories';
import {
  ensureScopedCannedCatalog,
  filterCannedByBusiness,
} from '../domain/templates/businessScope';
import {
  replaceTemplateVariables,
  resolveActiveCompanyProfile,
} from '../domain/templates/variableReplacer';
import { useBusinessTemplateState } from './BusinessTemplateContext';

export { CATEGORIES_CONFIG };

interface CannedResponseContextType {
  cannedResponses: CannedResponse[];
  allCannedResponses: CannedResponse[];
  categories: CannedCategoryConfig[];
  createCannedResponse: (
    data: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ) => Promise<CannedResponse>;
  updateCannedResponse: (
    id: string,
    data: Partial<Omit<CannedResponse, 'id' | 'createdAt'>>
  ) => Promise<boolean>;
  deleteCannedResponse: (id: string) => Promise<boolean>;
  toggleActiveStatus: (id: string) => void;
  incrementUsage: (id: string) => void;
  resetBusinessCannedResponses: (businessId: BusinessTemplateId) => void;
  replaceVariables: (template: string, customVars?: Record<string, string>) => string;
  refreshResponses: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = 'cusbox360_canned_responses';
const COMPANY_PROFILES_KEY = 'cb360_company_profiles_by_business';

const formatShortcut = (shortcut: string): string => {
  const clean = shortcut.trim();
  return clean.startsWith('/') ? clean : `/${clean}`;
};

const loadInitialCatalog = (): CannedResponse[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return ensureScopedCannedCatalog(parsed as CannedResponse[], businessTemplates);
      }
    }
  } catch (e) {
    console.warn('Failed to load canned responses from localStorage', e);
  }
  return ensureScopedCannedCatalog(mockCannedResponses, businessTemplates);
};

const CannedResponseContext = createContext<CannedResponseContextType | undefined>(undefined);

export const CannedResponseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: templateState } = useBusinessTemplateState();
  const activeBusiness = templateState.activeTemplateId;

  const [allResponses, setAllResponses] = useState<CannedResponse[]>(loadInitialCatalog);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allResponses));
    } catch (e) {
      console.error('Failed to save canned responses to localStorage', e);
    }
  }, [allResponses]);

  const refreshResponses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/canned-responses');
      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setAllResponses(ensureScopedCannedCatalog(json.data, businessTemplates));
        }
      }
    } catch {
      // Offline / dev fallback to local state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshResponses();
  }, []);

  const cannedResponses = useMemo(
    () => filterCannedByBusiness(allResponses, activeBusiness),
    [allResponses, activeBusiness]
  );

  const createCannedResponse: CannedResponseContextType['createCannedResponse'] = async (data) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const newResponse: CannedResponse = {
      ...data,
      id: `cr-${Date.now()}`,
      shortcut: formatShortcut(data.shortcut),
      businessScope: data.businessScope ?? activeBusiness,
      usageCount: 0,
      createdAt: dateStr,
      updatedAt: dateStr,
    };
    setAllResponses((prev) => [newResponse, ...prev]);
    fetch('/api/canned-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResponse),
    }).catch(() => {});
    return newResponse;
  };

  const updateCannedResponse: CannedResponseContextType['updateCannedResponse'] = async (
    id,
    data
  ) => {
    const dateStr = new Date().toISOString().split('T')[0];
    let updatedItem: CannedResponse | null = null;
    setAllResponses((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        updatedItem = {
          ...item,
          ...data,
          shortcut: data.shortcut ? formatShortcut(data.shortcut) : item.shortcut,
          updatedAt: dateStr,
        };
        return updatedItem;
      })
    );
    if (updatedItem) {
      fetch(`/api/canned-responses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      }).catch(() => {});
    }
    return true;
  };

  const deleteCannedResponse = async (id: string): Promise<boolean> => {
    setAllResponses((prev) => prev.filter((item) => item.id !== id));
    fetch(`/api/canned-responses/${id}`, { method: 'DELETE' }).catch(() => {});
    return true;
  };

  const toggleActiveStatus = (id: string) => {
    setAllResponses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
    );
  };

  const incrementUsage = (id: string) => {
    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAllResponses((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, usageCount: (item.usageCount || 0) + 1, lastUsedAt: timeStr }
          : item
      )
    );
  };

  const resetBusinessCannedResponses = (businessId: BusinessTemplateId) => {
    setAllResponses((prev) => {
      const withoutBusiness = prev.filter((item) => item.businessScope !== businessId);
      const baseB2b =
        businessId === 'b2b_wholesale'
          ? mockCannedResponses.filter((m) => m.businessScope === 'b2b_wholesale')
          : [];
      return ensureScopedCannedCatalog([...withoutBusiness, ...baseB2b], businessTemplates);
    });
  };

  const replaceVariables = (template: string, customVars?: Record<string, string>): string => {
    let overrides: Partial<Record<BusinessTemplateId, CompanyProfile>> | undefined;
    try {
      const raw = localStorage.getItem(COMPANY_PROFILES_KEY);
      if (raw) overrides = JSON.parse(raw);
    } catch {
      // Fallback to preset profile
    }
    const profile = resolveActiveCompanyProfile(activeBusiness, overrides);
    return replaceTemplateVariables(template, profile, customVars);
  };

  return (
    <CannedResponseContext.Provider
      value={{
        cannedResponses,
        allCannedResponses: allResponses,
        categories: CATEGORIES_CONFIG,
        createCannedResponse,
        updateCannedResponse,
        deleteCannedResponse,
        toggleActiveStatus,
        incrementUsage,
        resetBusinessCannedResponses,
        replaceVariables,
        refreshResponses,
        isLoading,
      }}
    >
      {children}
    </CannedResponseContext.Provider>
  );
};

export const useCannedResponses = () => {
  const context = useContext(CannedResponseContext);
  if (!context) {
    throw new Error('useCannedResponses must be used within a CannedResponseProvider');
  }
  return context;
};
