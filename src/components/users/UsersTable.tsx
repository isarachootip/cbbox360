import React from 'react';
import { KeyRound, Edit2, Trash2, ShieldCheck, UserCheck } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { UsersFilterBar } from './UsersFilterBar';
import { UserAccount } from '../../types';
import { AuthMode } from '../../config/authMode';

interface UsersTableProps {
  users: UserAccount[];
  currentUserId?: string;
  authMode: AuthMode;
  canManage: boolean;
  canTouchSysAdmin: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: string;
  onRoleFilterChange: (r: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  onSwitchUser: (username: string) => void;
  onToggleTwoFactor: (u: UserAccount) => void;
  onOpenTwoFactor: (u: UserAccount) => void;
  onToggleStatus: (u: UserAccount) => void;
  onOpenResetPassword: (u: UserAccount) => void;
  onOpenEdit: (u: UserAccount) => void;
  onOpenDelete: (u: UserAccount) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  currentUserId,
  authMode,
  canManage,
  canTouchSysAdmin,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onSwitchUser,
  onToggleTwoFactor,
  onOpenTwoFactor,
  onToggleStatus,
  onOpenResetPassword,
  onOpenEdit,
  onOpenDelete,
}) => (
  <div className="space-y-4">
    <UsersFilterBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      roleFilter={roleFilter}
      onRoleFilterChange={onRoleFilterChange}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
    />

    <div className="bg-white rounded-card border border-border overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-bg-muted text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">ผู้ใช้งาน (User)</th>
              <th className="px-4 py-3 font-medium">ชื่อผู้ใช้ (Username)</th>
              <th className="px-4 py-3 font-medium">รหัสผ่าน (Password)</th>
              <th className="px-4 py-3 font-medium">บทบาท (Role)</th>
              <th className="px-4 py-3 font-medium">แผนก / ฝ่ายงาน</th>
              <th className="px-4 py-3 font-medium text-center">2FA (MS Authen)</th>
              <th className="px-4 py-3 font-medium text-center">สถานะ</th>
              <th className="px-4 py-3 font-medium">เข้าสู่ระบบล่าสุด</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">การจัดการ (Actions)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {users.map((u) => {
              const isCurrent = currentUserId === u.id;
              const lockedByRole = u.role === 'sysadmin' && !canTouchSysAdmin;
              const rowReadOnly = !canManage || lockedByRole;

              return (
                <tr key={u.id} className={`hover:bg-bg-subtle transition-colors ${isCurrent ? 'bg-brand-tint/20' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 text-brand-deep shadow-xs"
                        style={{ backgroundColor: u.avatarBg || '#CFE2F8' }}
                      >
                        {u.initials}
                      </div>
                      <div>
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && <span className="text-[11px] text-brand font-semibold">(You)</span>}
                        </div>
                        <div className="text-[11px] text-text-secondary">{u.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-text-primary">{u.username}</td>
                  <td className="px-4 py-3">
                    {authMode === 'demo' ? (
                      <span className="font-mono text-text-secondary bg-bg-app px-2 py-0.5 rounded border border-border">{u.password}</span>
                    ) : u.mustChangePassword ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>รอเปลี่ยนรหัสครั้งแรก</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>พร้อมใช้งาน</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-text-body2">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={rowReadOnly}
                      onClick={() => onToggleTwoFactor(u)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ${u.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'} ${rowReadOnly ? 'cursor-default opacity-80' : 'hover:opacity-80 cursor-pointer'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>{u.twoFactorEnabled ? 'เปิดใช้งาน' : 'ไม่ได้เปิด'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={isCurrent || rowReadOnly}
                      onClick={() => onToggleStatus(u)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ${u.status === 'active' ? 'text-emerald-600' : 'text-slate-500'} ${isCurrent || rowReadOnly ? 'opacity-80 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{u.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-text-secondary">{u.lastLogin || '—'}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {authMode === 'demo' && !isCurrent && u.status === 'active' && (
                          <button type="button" onClick={() => onSwitchUser(u.username)} title={`สลับเข้าใช้งานเป็น ${u.username}`} className="p-1 text-brand hover:bg-brand-tint rounded"><UserCheck className="w-4 h-4" /></button>
                        )}
                        <button type="button" disabled={lockedByRole} onClick={() => onOpenTwoFactor(u)} title="ตั้งค่า 2FA" className={`p-1 rounded ${lockedByRole ? 'text-gray-300 cursor-not-allowed' : u.twoFactorEnabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-text-secondary hover:text-brand hover:bg-bg-app'}`}><ShieldCheck className="w-4 h-4" /></button>
                        <button type="button" disabled={lockedByRole} onClick={() => onOpenResetPassword(u)} title="รีเซ็ตรหัสผ่าน" className={`p-1 rounded ${lockedByRole ? 'text-gray-300 cursor-not-allowed' : 'text-amber-600 hover:bg-amber-50'}`}><KeyRound className="w-4 h-4" /></button>
                        <button type="button" disabled={lockedByRole} onClick={() => onOpenEdit(u)} title="แก้ไขข้อมูลผู้ใช้" className={`p-1 rounded ${lockedByRole ? 'text-gray-300 cursor-not-allowed' : 'text-text-secondary hover:text-brand hover:bg-bg-app'}`}><Edit2 className="w-4 h-4" /></button>
                        <button type="button" disabled={isCurrent || lockedByRole} onClick={() => onOpenDelete(u)} title="ลบผู้ใช้" className={`p-1 rounded ${isCurrent || lockedByRole ? 'text-gray-300 cursor-not-allowed' : 'text-text-secondary hover:text-rose-600 hover:bg-rose-50'}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
