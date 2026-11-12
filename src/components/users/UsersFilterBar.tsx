import React from 'react';
import { Search, Filter } from 'lucide-react';

interface UsersFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: string;
  onRoleFilterChange: (r: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
}

export const UsersFilterBar: React.FC<UsersFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => (
  <div className="bg-white rounded-card border border-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
    <div className="relative flex-1 max-w-md">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, อีเมล หรือแผนก..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white"
      />
    </div>

    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Filter className="w-3.5 h-3.5" />
        <span>Role:</span>
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="text-xs font-semibold px-2.5 py-1 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
        >
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="sysadmin">sysadmin</option>
          <option value="admin">admin</option>
          <option value="SF_1">SF_1 (Sales)</option>
          <option value="SF_2">SF_2 (Service)</option>
          <option value="SF_3">SF_3 (Credit)</option>
          <option value="supervisor">supervisor</option>
          <option value="doctor">doctor</option>
          <option value="nurse">nurse</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <span>สถานะ:</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="text-xs font-semibold px-2.5 py-1 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
        >
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="active">Active (ใช้งาน)</option>
          <option value="inactive">Inactive (ระงับ)</option>
        </select>
      </div>
    </div>
  </div>
);
