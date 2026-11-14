import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { TwoFactorSetupModal } from '../components/auth/TwoFactorSetupModal';
import { AuditLogsTab } from '../components/users/AuditLogsTab';
import { UsersTable } from '../components/users/UsersTable';
import { UserFormModal } from '../components/users/UserFormModal';
import { ResetPasswordModal } from '../components/users/ResetPasswordModal';
import { DeleteUserModal } from '../components/users/DeleteUserModal';
import { RolePermissionMatrixTab } from '../components/users/RolePermissionMatrixTab';
import { useAuth } from '../context/AuthContext';
import { useAuditLog } from '../context/AuditLogContext';
import { useToast } from '../context/ToastContext';
import { useUserManagementModals } from '../hooks/useUserManagementModals';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { authMode, users, currentUser, isAdmin, isSysAdmin, toggleTwoFactor, switchUser, syncDefaultUsers } = useAuth();
  const { showToast } = useToast();
  const { logAction } = useAuditLog();
  const modals = useUserManagementModals();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ทั้งหมด');
  const [skillFilter, setSkillFilter] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDefaultUsers = async () => {
    setIsSyncing(true);
    const res = await syncDefaultUsers();
    setIsSyncing(false);
    if (!res.success) return showToast(res.error || 'ซิงก์บัญชีมาตรฐานไม่สำเร็จ', 'error');
    const created = res.createdUsernames ?? [];
    showToast(
      created.length > 0
        ? `สร้างบัญชี Agent มาตรฐานเรียบร้อย (${created.join(', ')})`
        : 'บัญชี Agent มาตรฐานทั้ง 5 คนมีอยู่ในระบบครบถ้วนพร้อมใช้งานแล้ว',
      created.length > 0 ? 'success' : 'info'
    );
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ทั้งหมด' && u.role !== roleFilter) return false;
    if (skillFilter !== 'ทั้งหมด' && !(u.skills ?? []).includes(skillFilter as 'telephone' | 'line_chat_shop')) {
      return false;
    }
    if (statusFilter !== 'ทั้งหมด' && u.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      (u.extension ?? '').toLowerCase().includes(q)
    );
  });

  const activeCount = users.filter((u) => u.status === 'active').length;
  const inactiveCount = users.filter((u) => u.status === 'inactive').length;
  const sysAdminCount = users.filter((u) => u.role === 'sysadmin' || u.role === 'admin').length;

  const handleExportUsers = () => {
    logAction({
      userId: currentUser?.username || 'sysadmin',
      userRole: currentUser?.role,
      action: 'Export บัญชีรายชื่อผู้ใช้ทั้งหมด (CSV)',
      category: 'data',
      resource: 'User/Export',
    });
    showToast('สร้างไฟล์ Export ข้อมูลบัญชีผู้ใช้ในระบบเรียบร้อย (CSV)', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      <PageHeader
        title="User Management"
        actionButton={
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleExportUsers} className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold shadow-sm">
              <FileSpreadsheet className="w-3.5 h-3.5 text-text-secondary" />
              <span>Export รายชื่อ</span>
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncDefaultUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-brand/30 bg-brand-tint hover:bg-brand/15 disabled:opacity-60 text-brand rounded-lg text-xs font-semibold shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังซิงก์...' : 'ซิงก์บัญชี Agent มาตรฐาน'}</span>
                </button>
                <button type="button" onClick={modals.openCreate} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm">
                  <UserPlus className="w-4 h-4" />
                  <span>+ เพิ่มผู้ใช้ใหม่ (Create User)</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile label="ผู้ใช้ทั้งหมดในระบบ" value={users.length} variant="default" />
          <KpiTile label="สถานะพร้อมใช้งาน (Active)" value={activeCount} variant="success" />
          <KpiTile label="ระงับการใช้งาน (Inactive)" value={inactiveCount} variant={inactiveCount > 0 ? 'warning' : 'default'} />
          <KpiTile label="ผู้ดูแลระบบ (Admin / SysAdmin)" value={sysAdminCount} variant="default" />
        </div>

        <div className="flex items-center justify-between border-b border-border bg-white px-5 rounded-t-xl">
          <div className="flex items-center gap-6">
            {([
              { key: 'users', label: 'บัญชีผู้ใช้งาน' },
              { key: 'matrix', label: 'สิทธิ์การเข้าถึง (Permissions)' },
              { key: 'logs', label: 'Audit Logs' },
            ] as const).map((t) => (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={`py-3 text-xs font-bold relative ${activeTab === t.key ? 'text-brand' : 'text-text-secondary hover:text-text-primary'}`}>
                {t.label}
                {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t" />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => navigate('/menus')} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-tint hover:bg-brand/15 text-brand rounded-lg text-xs font-semibold">
            <span>จัดการสิทธิ์เมนูตาม Role (Menu Management)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTab === 'users' && (
          <UsersTable
            users={filteredUsers}
            currentUserId={currentUser?.id}
            authMode={authMode}
            canManage={isAdmin}
            canTouchSysAdmin={isSysAdmin}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            skillFilter={skillFilter}
            onSkillFilterChange={setSkillFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSwitchUser={(uname) => switchUser(uname) && showToast(`สลับบัญชีผู้ใช้งานเป็น "${uname}" สำเร็จ`, 'success')}
            onToggleTwoFactor={modals.handleToggleTwoFactor}
            onOpenTwoFactor={modals.setUserForTwoFactor}
            onToggleStatus={modals.handleToggleStatus}
            onOpenResetPassword={modals.openResetPassword}
            onOpenEdit={modals.openEdit}
            onOpenDelete={modals.openDelete}
          />
        )}
        {activeTab === 'matrix' && <RolePermissionMatrixTab />}
        {activeTab === 'logs' && <AuditLogsTab />}
      </div>

      <UserFormModal mode={modals.modalMode ?? 'create'} isOpen={modals.modalMode !== null} onClose={() => modals.setModalMode(null)} values={modals.formData} onChange={modals.setFormData} onSubmit={modals.handleFormSubmit} isSubmitting={modals.isSubmitting} canAssignSysAdmin={isSysAdmin} editingUsername={modals.selectedUser?.username} />
      <ResetPasswordModal isOpen={modals.isResetModalOpen} onClose={() => modals.setIsResetModalOpen(false)} user={modals.selectedUser} newPassword={modals.newPasswordInput} onPasswordChange={modals.setNewPasswordInput} mustChangePassword={modals.resetMustChange} onMustChangeToggle={modals.setResetMustChange} onSubmit={modals.handleResetSubmit} isSubmitting={modals.isSubmitting} />
      <DeleteUserModal isOpen={modals.isDeleteModalOpen} onClose={() => modals.setIsDeleteModalOpen(false)} user={modals.selectedUser} onConfirm={modals.handleDeleteConfirm} isSubmitting={modals.isSubmitting} />
      {modals.userForTwoFactor && (
        <TwoFactorSetupModal
          isOpen
          onClose={() => modals.setUserForTwoFactor(null)}
          user={modals.userForTwoFactor}
          onEnrolled={async (secret, code) => {
            const res = await toggleTwoFactor(modals.userForTwoFactor!.id, true, secret, code);
            if (res.success) showToast(`เปิดใช้งาน 2FA สำหรับ ${modals.userForTwoFactor!.username} สำเร็จ!`, 'success');
            return res;
          }}
        />
      )}
    </div>
  );
};
