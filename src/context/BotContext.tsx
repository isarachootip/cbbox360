import React, { createContext, useContext, useState, useEffect } from 'react';
import { BotSettings, BotAutoReplyRule, CompanyProfile, KnowledgeItem } from '../types';
import { initialBotSettings } from '../data/botSettings';
import { defaultCompanyProfile, defaultKnowledgeItems } from '../data/templateKnowledgePresets';
import { matchKnowledgeOrCompanyReply } from '../domain/templates/knowledgeMerge';
import { useCannedResponses } from './CannedResponseContext';
import { useToast } from './ToastContext';

interface TestMatchResult {
  matched: boolean;
  type: 'handoff' | 'rule' | 'welcome' | 'off_hours' | 'km' | 'none';
  rule?: BotAutoReplyRule;
  replyText: string;
  matchedKeyword?: string;
}

interface BotContextType {
  settings: BotSettings;
  updateSettings: (partial: Partial<BotSettings>) => void;
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
  testMatch: (userText: string, customVars?: Record<string, string>) => TestMatchResult;
  isSaving: boolean;
}

const BotContext = createContext<BotContextType | undefined>(undefined);
const STORAGE_KEY = 'cb360_bot_settings';

const normalizeBotSettings = (raw: Partial<BotSettings>): BotSettings => ({
  ...initialBotSettings,
  ...raw,
  companyProfile: {
    ...defaultCompanyProfile,
    ...(raw.companyProfile || {}),
  },
  knowledgeItems: Array.isArray(raw.knowledgeItems) ? raw.knowledgeItems : defaultKnowledgeItems,
});

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cannedResponses, replaceVariables } = useCannedResponses();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<BotSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isEnabled === 'boolean') {
          return normalizeBotSettings(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load bot settings from localStorage', e);
    }
    return initialBotSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save bot settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        const res = await fetch('/api/bot-settings');
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setSettings(normalizeBotSettings(json.data));
          }
        }
      } catch (_err) {
        // Fallback to local
      }
    };
    fetchRemoteSettings();
  }, []);

  const saveToBackend = async (newSettings: BotSettings) => {
    try {
      setIsSaving(true);
      await fetch('/api/bot-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (_err) {
      // Ignore network fail in offline mode
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (partial: Partial<BotSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveToBackend(updated);
      return updated;
    });
    showToast('บันทึกการตั้งค่า Bot เรียบร้อยแล้ว', 'success');
  };

  const updateCompanyProfile = (partial: Partial<CompanyProfile>) => {
    setSettings((prev) => {
      const nextProfile: CompanyProfile = {
        ...(prev.companyProfile ?? defaultCompanyProfile),
        ...partial,
      };
      const updated: BotSettings = {
        ...prev,
        companyProfile: nextProfile,
        companyName: nextProfile.companyName,
      };
      saveToBackend(updated);
      return updated;
    });
    showToast('บันทึกข้อมูลองค์กรเรียบร้อยแล้ว', 'success');
  };

  const addKnowledgeItem = (itemData: Omit<KnowledgeItem, 'id'>) => {
    const newItem: KnowledgeItem = { ...itemData, id: `km-${Date.now()}` };
    setSettings((prev) => {
      const current = prev.knowledgeItems ?? defaultKnowledgeItems;
      const updated = { ...prev, knowledgeItems: [newItem, ...current] };
      saveToBackend(updated);
      return updated;
    });
    showToast(`เพิ่มหัวข้อความรู้ "${newItem.title}" สำเร็จ`, 'success');
  };

  const updateKnowledgeItem = (id: string, partial: Partial<KnowledgeItem>) => {
    setSettings((prev) => {
      const current = prev.knowledgeItems ?? defaultKnowledgeItems;
      const updated = {
        ...prev,
        knowledgeItems: current.map((item) => (item.id === id ? { ...item, ...partial } : item)),
      };
      saveToBackend(updated);
      return updated;
    });
    showToast('อัปเดตหัวข้อความรู้ AI สำเร็จ', 'success');
  };

  const deleteKnowledgeItem = (id: string) => {
    setSettings((prev) => {
      const current = prev.knowledgeItems ?? defaultKnowledgeItems;
      const updated = {
        ...prev,
        knowledgeItems: current.filter((item) => item.id !== id),
      };
      saveToBackend(updated);
      return updated;
    });
    showToast('ลบหัวข้อความรู้ AI สำเร็จ', 'info');
  };

  const toggleKnowledgeItemActive = (id: string) => {
    setSettings((prev) => {
      const current = prev.knowledgeItems ?? defaultKnowledgeItems;
      const updated = {
        ...prev,
        knowledgeItems: current.map((item) =>
          item.id === id ? { ...item, isActive: !item.isActive } : item
        ),
      };
      saveToBackend(updated);
      return updated;
    });
  };

  const toggleBot = () => {
    setSettings((prev) => {
      const updated = { ...prev, isEnabled: !prev.isEnabled };
      saveToBackend(updated);
      showToast(
        updated.isEnabled ? 'เปิดใช้งาน Bot ตอบอัตโนมัติแล้ว' : 'ปิดใช้งาน Bot ตอบอัตโนมัติแล้ว',
        updated.isEnabled ? 'success' : 'info'
      );
      return updated;
    });
  };

  const addRule = (ruleData: Omit<BotAutoReplyRule, 'id'>) => {
    const newRule: BotAutoReplyRule = { ...ruleData, id: `rule-${Date.now()}` };
    setSettings((prev) => {
      const updated = { ...prev, rules: [...prev.rules, newRule] };
      saveToBackend(updated);
      return updated;
    });
    showToast(`เพิ่มกฎ "${newRule.name}" สำเร็จ`, 'success');
  };

  const updateRule = (id: string, partial: Partial<BotAutoReplyRule>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        rules: prev.rules.map((r) => (r.id === id ? { ...r, ...partial } : r)),
      };
      saveToBackend(updated);
      return updated;
    });
    showToast('อัปเดตกฎ Auto-Reply สำเร็จ', 'success');
  };

  const deleteRule = (id: string) => {
    setSettings((prev) => {
      const updated = { ...prev, rules: prev.rules.filter((r) => r.id !== id) };
      saveToBackend(updated);
      return updated;
    });
    showToast('ลบกฎ Auto-Reply สำเร็จ', 'success');
  };

  const toggleRuleActive = (id: string) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        rules: prev.rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
      };
      saveToBackend(updated);
      return updated;
    });
  };

  const testMatch = (userText: string, customVars?: Record<string, string>): TestMatchResult => {
    if (!settings.isEnabled) {
      return { matched: false, type: 'none', replyText: 'Bot ปิดใช้งานอยู่ (Inactive)' };
    }
    const cleanInput = userText.trim().toLowerCase();

    if (settings.humanHandoffEnabled) {
      const handoffHit = settings.humanHandoffKeywords.some((kw) =>
        cleanInput.includes(kw.trim().toLowerCase())
      );
      if (handoffHit) {
        return { matched: true, type: 'handoff', replyText: settings.handoffMessage };
      }
    }

    const activeRules = settings.rules
      .filter((r) => r.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      for (const kw of rule.keywords) {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) continue;
        const hit = rule.matchType === 'exact' ? cleanInput === cleanKw : cleanInput.includes(cleanKw);
        if (hit) {
          let text = rule.customReplyText;
          if (!text && rule.cannedResponseId) {
            const canned = cannedResponses.find((c) => c.id === rule.cannedResponseId);
            if (canned) text = replaceVariables(canned.content, customVars);
          }
          return {
            matched: true,
            type: 'rule',
            rule,
            replyText: text || 'ไม่มีข้อความตอบกลับที่กำหนดไว้',
            matchedKeyword: kw,
          };
        }
      }
    }

    const kmHit = matchKnowledgeOrCompanyReply(
      userText,
      settings.companyProfile ?? defaultCompanyProfile,
      settings.knowledgeItems ?? defaultKnowledgeItems
    );
    if (kmHit.matched) {
      return {
        matched: true,
        type: 'km',
        replyText: kmHit.replyText,
        matchedKeyword: kmHit.matchedTopic,
      };
    }

    return {
      matched: false,
      type: 'none',
      replyText: 'ไม่พบคำสำคัญที่ตรงกับกฎใดๆ ในระบบ',
    };
  };

  return (
    <BotContext.Provider
      value={{
        settings,
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
