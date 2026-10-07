import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditCategory, AuditStatus } from '../types';

interface AuditLogContextType {
  logs: AuditLogEntry[];
  logAction: (entry: {
    userId: string;
    userRole?: string;
    action: string;
    category: AuditCategory;
    resource?: string;
    ipAddress?: string;
    status?: AuditStatus;
    details?: string;
  }) => Promise<void>;
  exportAuditLogs: (logsToExport?: AuditLogEntry[]) => void;
  isLoading: boolean;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

const STORAGE_KEY = 'cb360_audit_logs';

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    userId: 'sysadmin',
    userRole: 'sysadmin',
    action: 'เข้าสู่ระบบ (Sign In) พร้อม 2FA',
    category: 'security',
    resource: 'Auth/Sign-In',
    ipAddress: '192.168.1.100',
    status: 'success',
    details: 'TOTP Verified',
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userId: 'SF_2',
    userRole: 'SF_2',
    action: 'เปิดดูข้อมูลลูกค้าส่วนบุคคล (PII View)',
    category: 'access',
    resource: 'Customer/C00123 (สมชาย ใจดี)',
    ipAddress: '192.168.1.104',
    status: 'success',
    details: 'Customer 360 Profile accessed',
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    userId: 'admin',
    userRole: 'admin',
    action: 'ปรับปรุงการตั้งค่า Webhook (LINE OA)',
    category: 'system',
    resource: 'Connector/conn-line',
    ipAddress: '192.168.1.101',
    status: 'success',
    details: 'HMAC-SHA256 signature verification enabled',
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    userId: 'SF_1',
    userRole: 'SF_1',
    action: 'สร้าง Deal ใหม่ใน Sales Pipeline',
    category: 'data',
    resource: 'Deal/D0012 (฿185,000)',
    ipAddress: '192.168.1.103',
    status: 'success',
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    userId: 'anonymous',
    userRole: 'unknown',
    action: 'พยายามเข้าสู่ระบบผิดพลาด (Failed Sign In)',
    category: 'security',
    resource: 'Auth/Login',
    ipAddress: '110.168.22.45',
    status: 'failure',
    details: 'Wrong credentials for user admin_temp',
  },
];

export const AuditLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return initialAuditLogs;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore storage quota
    }
  }, [logs]);

  // Initial fetch from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/audit-logs?limit=100');
        if (res.ok) {
          const json = await res.json();
          if (json?.logs && Array.isArray(json.logs) && json.logs.length > 0) {
            setLogs((prev) => {
              const ids = new Set(json.logs.map((l: AuditLogEntry) => l.id));
              const localOnly = prev.filter((p) => !ids.has(p.id));
              return [...json.logs, ...localOnly];
            });
          }
        }
      } catch {
        // Fallback to local
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const logAction = useCallback<AuditLogContextType['logAction']>(async (entry) => {
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const newLog: AuditLogEntry = {
      id,
      timestamp,
      userId: entry.userId,
      userRole: entry.userRole,
      action: entry.action,
      category: entry.category,
      resource: entry.resource,
      ipAddress: entry.ipAddress || '192.168.1.100',
      status: entry.status || 'success',
      details: entry.details,
    };

    setLogs((prev) => [newLog, ...prev]);

    // Send to backend asynchronously
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch {
      // Offline/fallback
    }
  }, []);

  const exportAuditLogs = useCallback((logsToExport?: AuditLogEntry[]) => {
    const data = logsToExport || logs;
    const headers = ['Timestamp', 'User', 'Role', 'Category', 'Action', 'Resource', 'IP Address', 'Status', 'Details'];
    const rows = data.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userId}"`,
      `"${l.userRole || '-'}"`,
      `"${l.category}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.resource || '-').replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`,
      `"${(l.details || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `custbox360_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logs]);

  return (
    <AuditLogContext.Provider value={{ logs, logAction, exportAuditLogs, isLoading }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
