import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuditLog } from '../../context/AuditLogContext';
import { AuditCategory, AuditLogEntry } from '../../types';

export const AuditLogsTab: React.FC = () => {
  const { logs, exportAuditLogs, isLoading } = useAuditLog();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOptions: { key: string; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'security', label: 'ความปลอดภัย & Auth' },
    { key: 'access', label: 'การเข้าถึงข้อมูล PII' },
    { key: 'data', label: 'กิจกรรมข้อมูล' },
    { key: 'user', label: 'จัดการผู้ใช้' },
    { key: 'system', label: 'ระบบ & คอนฟิก' },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.userId.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.resource && log.resource.toLowerCase().includes(q)) ||
          log.ipAddress.includes(q)
        );
      }
      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  const renderStatus = (status: AuditLogEntry['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Success</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Warning</span>
          </span>
        );
      case 'failure':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString('th-TH', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-bg-subtle/40">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-text-primary">
              ประวัติกิจกรรมความปลอดภัย (Security Audit Trail)
            </h2>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">
            บันทึกการเข้าถึงข้อมูล PII, การยืนยันตัวตน และกิจกรรมระบบตามมาตรฐาน ISO 27001 (A.12.4) และ ISO 29100 / PDPA
          </p>
        </div>

        <button
          onClick={() => exportAuditLogs(filteredLogs)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-bg-app text-text-primary rounded-lg text-xs font-semibold shadow-2xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export รายงาน Audit (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 border-b border-divider flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white">
        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categoryOptions.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-brand text-white font-semibold shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาผู้ใช้, การกระทำ, IP..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-bg-subtle border-b border-border text-text-secondary">
            <tr>
              <th className="px-4 py-2.5 font-medium">วัน-เวลา</th>
              <th className="px-4 py-2.5 font-medium">ผู้ดำเนินการ</th>
              <th className="px-4 py-2.5 font-medium">หมวดหมู่</th>
              <th className="px-4 py-2.5 font-medium">กิจกรรม / การกระทำ</th>
              <th className="px-4 py-2.5 font-medium">เป้าหมาย (Resource)</th>
              <th className="px-4 py-2.5 font-medium">IP Address</th>
              <th className="px-4 py-2.5 font-medium text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  ไม่พบรายการบันทึก Audit ตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                    {formatLogTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-text-primary block">{log.userId}</span>
                    {log.userRole && (
                      <span className="text-[10px] text-text-secondary font-mono">({log.userRole})</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] font-mono text-purple-700 font-medium">
                      {log.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-primary font-medium">{log.action}</td>
                  <td className="px-4 py-2.5 text-text-secondary font-mono text-[11px]">
                    {log.resource || '-'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                    {renderStatus(log.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
