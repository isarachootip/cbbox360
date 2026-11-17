import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  BotSettings,
  BotAutoReplyRule,
  BusinessTemplateId,
  CompanyProfile,
  KnowledgeItem,
} from '../types';
import { initialBotSettings } from '../data/botSettings';
import { businessTemplates } from '../data/businessTemplates';
import { defaultKnowledgeItems } from '../data/templateKnowledgePresets';
import {
  ensureScopedBotRules,
  ensureScopedKnowledgeItems,
  filterBotRulesByBusiness,
  filterKnowledgeByBusiness,
} from '../domain/templates/businessScope';
import { resolveActiveCompanyProfile } from '../domain/templates/variableReplacer';
import {
  BotTestMatchResult,
  evaluateBotMatch,
  normalizeBotSettings,
} from '../domain/templates/botMatcher';
import { useBusinessTemplateState } from './BusinessTemplateContext';
import { useCannedResponses } from './CannedResponseContext';
import { useToast } from './ToastContext';

interface BotContextType {
  settings: BotSettings;
  updateSettings: (partial: Partial<BotSettings>, toastMessage?: string) => void;
  updateCompanyProfile: (partial: Partial<CompanyProfile>) => void;
  addKnowledgeItem: (item: Omit<KnowledgeItem, 'id'>) => void;
  updateKnowledgeItem: (id: string, partial: Partial<KnowledgeItem>) => void;
  deleteKnowledgeItem: (id: string) => void;
  toggleKnowledgeItemActive: (id: string) => void;
  toggleBot: () => void;
  addRule: (rule: Omit<BotAutoReplyRule, 'id'>) => void;
  updateRule: (id: string, partial: Partial<BotAutoReplyRule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleActive: (id: string) => void;
  resetBusinessBotData: (businessId: BusinessTemplateId) => void;
  testMatch: (userText: string, customVars?: Record<string, string>) => BotTestMatchResult;
  isSaving: boolean;
}

const BotContext = createContext<BotContextType | undefined>(undefined);
const STORAGE_KEY = 'cb360_bot_settings';
const COMPANY_PROFILES_KEY = 'cb360_company_profiles_by_business';

const loadCompanyOverrides = (): Partial<Record<BusinessTemplateId, CompanyProfile>> => {
  try {
    const raw = localStorage.getItem(COMPANY_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: templateState } = useBusinessTemplateState();
  const activeBusiness = templateState.activeTemplateId;
  const { cannedResponses, allCannedResponses, replaceVariables } = useCannedResponses();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOverrides, setCompanyOverrides] =
    useState<Partial<Record<BusinessTemplateId, CompanyProfile>>>(loadCompanyOverrides);

  const [rawSettings, setRawSettings] = useState<BotSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isEnabled === 'boolean') {
          return normalizeBotSettings(parsed, allCannedResponses);
        }
      }
    } catch (e) {
      console.warn('Failed to load bot settings from localStorage', e);
    }
    return normalizeBotSettings(initialBotSettings, allCannedResponses);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawSettings));
    } catch (e) {
      console.error('Failed to save bot settings', e);
    }
  }, [rawSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_PROFILES_KEY, JSON.stringify(companyOverrides));
    } catch (e) {
      console.error('Failed to save company profile overrides', e);
    }
  }, [companyOverrides]);

  const saveToBackend = async (next: BotSettings) => {
    try {
      setIsSaving(true);
      await fetch('/api/bot-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {
      // Offline mode fallback
    } finally {
      setIsSaving(false);
    }
  };

  const scopedSettings: BotSettings = useMemo(() => {
    const activeProfile = resolveActiveCompanyProfile(activeBusiness, companyOverrides);
    return {
      ...rawSettings,
      companyProfile: activeProfile,
      companyName: activeProfile.companyName,
      rules: filterBotRulesByBusiness(rawSettings.rules, activeBusiness),
      knowledgeItems: filterKnowledgeByBusiness(
        rawSettings.knowledgeItems ?? defaultKnowledgeItems,
        activeBusiness
      ),
    };
  }, [rawSettings, activeBusiness, companyOverrides]);

  const updateSettings = (partial: Partial<BotSettings>, toastMessage?: string) => {
    setRawSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveToBackend(updated);
      return updated;
    });
    showToast(toastMessage || 'บันทึกการตั้งค่า Bot เรียบร้อยแล้ว', 'success');
  };

  const updateCompanyProfile = (partial: Partial<CompanyProfile>) => {
    const base = resolveActiveCompanyProfile(activeBusiness, companyOverrides);
    const nextProfile: CompanyProfile = { ...base, ...partial };
    setCompanyOverrides((prev) => ({ ...prev, [activeBusiness]: nextProfile }));
    showToast('บันทึกข้อมูลองค์กรเรียบร้อยแล้ว', 'success');
  };

  const addKnowledgeItem = (itemData: Omit<KnowledgeItem, 'id'>) => {
    const newItem: KnowledgeItem = {
      ...itemData,
      id: `km-${Date.now()}`,
      templateId: activeBusiness,
      businessScope: itemData.businessScope ?? activeBusiness,
    };
    setRawSettings((prev) => {
      const current = prev.knowledgeItems ?? defaultKnowledgeItems;
      const updated = { ...prev, knowledgeItems: [newItem, ...current] };
      saveToBackend(updated);
      return updated;
    });
    showToast(`เพิ่มหัวข้อความรู้ "${newItem.title}" สำเร็จ`, 'success');
  };

  const updateKnowledgeItem = (id: string, partial: Partial<KnowledgeItem>) => {
    setRawSettings((prev) => ({
      ...prev,
      knowledgeItems: (prev.knowledgeItems ?? defaultKnowledgeItems).map((item) =>
        item.id === id ? { ...item, ...partial } : item
      ),
    }));
    showToast('อัปเดตหัวข้อความรู้ AI สำเร็จ', 'success');
  };

  const deleteKnowledgeItem = (id: string) => {
    setRawSettings((prev) => ({
      ...prev,
      knowledgeItems: (prev.knowledgeItems ?? defaultKnowledgeItems).filter((i) => i.id !== id),
    }));
    showToast('ลบหัวข้อความรู้ AI สำเร็จ', 'info');
  };

  const toggleKnowledgeItemActive = (id: string) => {
    setRawSettings((prev) => ({
      ...prev,
      knowledgeItems: (prev.knowledgeItems ?? defaultKnowledgeItems).map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ),
    }));
  };

  const toggleBot = () => {
    setRawSettings((prev) => {
      const updated = { ...prev, isEnabled: !prev.isEnabled };
      showToast(
        updated.isEnabled ? 'เปิดใช้งาน Bot ตอบอัตโนมัติแล้ว' : 'ปิดใช้งาน Bot ตอบอัตโนมัติแล้ว',
        updated.isEnabled ? 'success' : 'info'
      );
      return updated;
    });
  };

  const addRule = (ruleData: Omit<BotAutoReplyRule, 'id'>) => {
    const newRule: BotAutoReplyRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      businessScope: ruleData.businessScope ?? activeBusiness,
    };
    setRawSettings((prev) => ({ ...prev, rules: [...prev.rules, newRule] }));
    showToast(`เพิ่มกฎ "${newRule.name}" สำเร็จ`, 'success');
  };

  const updateRule = (id: string, partial: Partial<BotAutoReplyRule>) => {
    setRawSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    }));
    showToast('อัปเดตกฎ Auto-Reply สำเร็จ', 'success');
  };

  const deleteRule = (id: string) => {
    setRawSettings((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
    showToast('ลบกฎ Auto-Reply สำเร็จ', 'success');
  };

  const toggleRuleActive = (id: string) => {
    setRawSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    }));
  };

  const resetBusinessBotData = (businessId: BusinessTemplateId) => {
    setCompanyOverrides((prev) => {
      const copy = { ...prev };
      delete copy[businessId];
      return copy;
    });
    setRawSettings((prev) => {
      const keptRules = prev.rules.filter((r) => r.businessScope !== businessId);
      const baseB2bRules =
        businessId === 'b2b_wholesale'
          ? initialBotSettings.rules.filter((r) => r.businessScope === 'b2b_wholesale')
          : [];
      const keptKm = (prev.knowledgeItems ?? defaultKnowledgeItems).filter(
        (k) => (k.businessScope ?? k.templateId) !== businessId
      );
      const baseB2bKm = businessId === 'b2b_wholesale' ? defaultKnowledgeItems : [];
      return {
        ...prev,
        rules: ensureScopedBotRules([...keptRules, ...baseB2bRules], businessTemplates, allCannedResponses),
        knowledgeItems: ensureScopedKnowledgeItems([...keptKm, ...baseB2bKm], businessTemplates),
      };
    });
  };

  const testMatch = (userText: string, customVars?: Record<string, string>): BotTestMatchResult =>
    evaluateBotMatch(userText, scopedSettings, cannedResponses, replaceVariables, customVars);

  return (
    <BotContext.Provider
      value={{
        settings: scopedSettings,
        updateSettings,
        updateCompanyProfile,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
        toggleKnowledgeItemActive,
        toggleBot,
        addRule,
        updateRule,
        deleteRule,
        toggleRuleActive,
        resetBusinessBotData,
        testMatch,
        isSaving,
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
};
