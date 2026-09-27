import React, { createContext, useContext, useState, useEffect } from 'react';
import { BotSettings, BotAutoReplyRule } from '../types';
import { initialBotSettings } from '../data/botSettings';
import { useCannedResponses } from './CannedResponseContext';
import { useToast } from './ToastContext';

interface TestMatchResult {
  matched: boolean;
  type: 'handoff' | 'rule' | 'welcome' | 'off_hours' | 'none';
  rule?: BotAutoReplyRule;
  replyText: string;
  matchedKeyword?: string;
}

interface BotContextType {
  settings: BotSettings;
  updateSettings: (partial: Partial<BotSettings>) => void;
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
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load bot settings from localStorage', e);
    }
    return initialBotSettings;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save bot settings to localStorage', e);
    }
  }, [settings]);

  // Initial fetch from backend if available
  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        const res = await fetch('/api/bot-settings');
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setSettings(json.data);
          }
        }
      } catch (err) {
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
    } catch (err) {
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
    const newRule: BotAutoReplyRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
    };
    setSettings((prev) => {
      const updated = { ...prev, rules: [...prev.rules, newRule] };
      saveToBackend(updated);
      return updated;
    });
    showToast(`เพิ่มกฎ "${newRule.name}" สำเร็จ`, 'success');
  };

  const updateRule = (id: string, partial: Partial<BotAutoReplyRule>) => {
    setSettings((prev) => {
      const updatedRules = prev.rules.map((r) => (r.id === id ? { ...r, ...partial } : r));
      const updated = { ...prev, rules: updatedRules };
      saveToBackend(updated);
      return updated;
    });
    showToast('อัปเดตกฎ Auto-Reply สำเร็จ', 'success');
  };

  const deleteRule = (id: string) => {
    setSettings((prev) => {
      const updatedRules = prev.rules.filter((r) => r.id !== id);
      const updated = { ...prev, rules: updatedRules };
      saveToBackend(updated);
      return updated;
    });
    showToast('ลบกฎ Auto-Reply สำเร็จ', 'success');
  };

  const toggleRuleActive = (id: string) => {
    setSettings((prev) => {
      const updatedRules = prev.rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
      const updated = { ...prev, rules: updatedRules };
      saveToBackend(updated);
      return updated;
    });
  };

  const testMatch = (userText: string, customVars?: Record<string, string>): TestMatchResult => {
    if (!settings.isEnabled) {
      return {
        matched: false,
        type: 'none',
        replyText: 'Bot ปิดใช้งานอยู่ (Inactive)',
      };
    }

    const cleanInput = userText.trim().toLowerCase();

    // 1. Check Human Handoff Keywords
    if (settings.humanHandoffEnabled) {
      const handoffHit = settings.humanHandoffKeywords.some((kw) =>
        cleanInput.includes(kw.trim().toLowerCase())
      );
      if (handoffHit) {
        return {
          matched: true,
          type: 'handoff',
          replyText: settings.handoffMessage,
        };
      }
    }

    // 2. Check Keyword Rules
    const activeRules = settings.rules
      .filter((r) => r.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      for (const kw of rule.keywords) {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) continue;

        let hit = false;
        if (rule.matchType === 'exact') {
          hit = cleanInput === cleanKw;
        } else {
          hit = cleanInput.includes(cleanKw);
        }

        if (hit) {
          let text = rule.customReplyText;
          if (!text && rule.cannedResponseId) {
            const canned = cannedResponses.find((c) => c.id === rule.cannedResponseId);
            if (canned) {
              text = replaceVariables(canned.content, customVars);
            }
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
