import React, { createContext, useContext, useState, useEffect } from 'react';
import { CannedResponse, CannedResponseCategory } from '../types';
import { mockCannedResponses } from '../data/cannedResponses';
import { useToast } from './ToastContext';

interface CannedResponseContextType {
  cannedResponses: CannedResponse[];
  categories: { key: CannedResponseCategory; label: string; icon: string; description: string; color: string }[];
  createCannedResponse: (data: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<CannedResponse>;
  updateCannedResponse: (id: string, data: Partial<Omit<CannedResponse, 'id' | 'createdAt'>>) => Promise<boolean>;
  deleteCannedResponse: (id: string) => Promise<boolean>;
  toggleActiveStatus: (id: string) => void;
  incrementUsage: (id: string) => void;
  replaceVariables: (template: string, customVars?: Record<string, string>) => string;
  refreshResponses: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = 'cusbox360_canned_responses';

export const CATEGORIES_CONFIG: {
  key: CannedResponseCategory;
  label: string;
  icon: string;
  description: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    lightBg: string;
  };
}[] = [
  {
    key: 'greeting',
    label: 'Greeting (ทักทาย / ต้อนรับ)',
    icon: '👋',
    description: 'ข้อความเปิดการสนทนา ต้อนรับลูกค้า และกล่าวทักทาย',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      lightBg: 'hover:bg-purple-50/50',
    },
  },
  {
    key: 'question',
    label: 'Question (คำถาม / ขอข้อมูล)',
    icon: '❓',
    description: 'คำถามเก็บข้อมูล ขอหลักฐาน ที่อยู่ หรือสอบถามเพิ่มเติม',
    color: {
      key: 'question',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      lightBg: 'hover:bg-amber-50/50',
    } as any,
  },
  {
    key: 'answer',
    label: 'Answer (คำตอบ / ข้อมูลสำคัญ)',
    icon: '💡',
    description: 'คำตอบสำเร็จรูป ข้อมูลชำระเงิน รอบส่งพัสดุ และเงื่อนไขบริการ',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      lightBg: 'hover:bg-emerald-50/50',
    },
  },
];

const CannedResponseContext = createContext<CannedResponseContextType | undefined>(undefined);

export const CannedResponseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load canned responses from localStorage', e);
    }
    return mockCannedResponses;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cannedResponses));
    } catch (e) {
      console.error('Failed to save canned responses to localStorage', e);
    }
  }, [cannedResponses]);

  // Sync from backend API if running
  const refreshResponses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/canned-responses');
      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setCannedResponses(json.data);
        }
      }
    } catch (e) {
      // Offline / dev fallback to local state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshResponses();
  }, []);

  // Helper: Format Shortcut to always start with "/"
  const formatShortcut = (shortcut: string) => {
    let clean = shortcut.trim();
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    return clean;
  };

  // 1. Create
  const createCannedResponse = async (
    data: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<CannedResponse> => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newResponse: CannedResponse = {
      ...data,
      id: `cr-${Date.now()}`,
      shortcut: formatShortcut(data.shortcut),
      usageCount: 0,
      createdAt: dateStr,
      updatedAt: dateStr,
    };

    setCannedResponses((prev) => [newResponse, ...prev]);

    // Backend sync
    try {
      await fetch('/api/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResponse),
      });
    } catch (e) {
      console.warn('Backend API not responding, saved to local state');
    }

    return newResponse;
  };

  // 2. Update
  const updateCannedResponse = async (
    id: string,
    data: Partial<Omit<CannedResponse, 'id' | 'createdAt'>>
  ): Promise<boolean> => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    let updatedItem: CannedResponse | null = null;

    setCannedResponses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = {
            ...item,
            ...data,
            shortcut: data.shortcut ? formatShortcut(data.shortcut) : item.shortcut,
            updatedAt: dateStr,
          };
          return updatedItem;
        }
        return item;
      })
    );

    // Backend sync
    if (updatedItem) {
      try {
        await fetch(`/api/canned-responses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch (e) {
        console.warn('Backend API sync error');
      }
    }

    return true;
  };

  // 3. Delete
  const deleteCannedResponse = async (id: string): Promise<boolean> => {
    setCannedResponses((prev) => prev.filter((item) => item.id !== id));

    // Backend sync
    try {
      await fetch(`/api/canned-responses/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend API sync error');
    }

    return true;
  };

  // 4. Toggle Active Status
  const toggleActiveStatus = (id: string) => {
    setCannedResponses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, isActive: !item.isActive };
          // Background sync
          fetch(`/api/canned-responses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        }
        return item;
      })
    );
  };

  // 5. Increment Usage
  const incrementUsage = (id: string) => {
    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setCannedResponses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            usageCount: (item.usageCount || 0) + 1,
            lastUsedAt: timeStr,
          };
          return updated;
        }
        return item;
      })
    );
  };

  // 6. Template Variable Replacer
  const replaceVariables = (
    template: string,
    customVars?: Record<string, string>
  ): string => {
    const defaultVars: Record<string, string> = {
      customer_name: 'สมชาย ใจดี',
      order_code: 'SO-10482',
      tracking_no: 'TH2609-88412',
      agent_name: 'วิภา ส.',
      company_name: 'บจก. คัสบอกซ์ สามหกศูนย์ (CusBox360)',
      phone: '081-892-5678',
      credit_term: '30 วัน',
      ...customVars,
    };

    let result = template;
    for (const [key, val] of Object.entries(defaultVars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, val);
    }
    return result;
  };

  return (
    <CannedResponseContext.Provider
      value={{
        cannedResponses,
        categories: CATEGORIES_CONFIG as any,
        createCannedResponse,
        updateCannedResponse,
        deleteCannedResponse,
        toggleActiveStatus,
        incrementUsage,
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
