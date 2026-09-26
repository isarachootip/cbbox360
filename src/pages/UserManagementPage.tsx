import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserAccount, UserRole } from '../types';

export const UserManagementPage: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    switchUser,
  } = useAuth();
  const { showToast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected User for action
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '1234',
    name: '',
    email: '',
    role: 'SF_1' as UserRole,
    department: 'Sales & Business Development',
    status: 'active' as 'active' | 'inactive',
    avatarBg: '#CFE2F8',
  });

  const [newPasswordInput, setNewPasswordInput] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ทั้งหมด' && u.role !== roleFilter) return false;
    if (statusFilter !== 'ทั้งหมด' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const activeCount = users.filter((u) => u.status === 'active').length;
  const inactiveCount = users.filter((u) => u.status === 'inactive').length;
  const sysAdminCount = users.filter((u) => u.role === 'sysadmin' || u.role === 'admin').length;

  const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { bg: string; text: string; label: string }> = {
      sysadmin: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800', label: 'sysadmin' },
      admin: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: 'admin' },
      SF_1: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'SF_1 (Sales)' },
      SF_2: { bg: 'bg-cyan-100 border-cyan-300', text: 'text-cyan-800', label: 'SF_2 (Service)' },
      SF_3: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'SF_3 (Credit)' },
      supervisor: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-800', label: 'supervisor' },
    };
    const c = config[role] || { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-800', label: role };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // Handlers
  const handleOpenCreate = () => {
    setFormData({
      username: '',
      password: '1234',
      name: '',
      email: '',
      role: 'SF_1',
      department: 'Sales & Business Development',
      status: 'active',
      avatarBg: '#CFE2F8',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) return;

    const res = createUser(formData);
    if (res.success) {
      showToast(`สร้างผู้ใช้ "${formData.username}" เรียบร้อยแล้ว`, 'success');
      setIsCreateModalOpen(false);
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้', 'error');
    }
  };

  const handleOpenEdit = (u: UserAccount) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      password: u.password,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      status: u.status,
      avatarBg: u.avatarBg || '#CFE2F8',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = updateUser(selectedUser.id, formData);
    if (res.success) {
      showToast(`แก้ไขข้อมูลผู้ใช้ "${selectedUser.username}" เรียบร้อย`, 'success');
      setIsEditModalOpen(false);
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาดในการแก้ไข', 'error');
    }
  };

  const handleOpenResetPassword = (u: UserAccount) => {
    setSelectedUser(u);
    setNewPasswordInput('1234');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordInput.trim()) return;

    const res = resetPassword(selectedUser.id, newPasswordInput.trim());
    if (res.success) {
      showToast(`รีเซ็ตรหัสผ่านของ "${selectedUser.username}" เป็น "${newPasswordInput.trim()}" แล้ว`, 'success');
      setIsResetPasswordModalOpen(false);
    } else {
      showToast(res.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
    }
  };

  const handleOpenDelete = (u: UserAccount) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!selectedUser) return;

    const res = deleteUser(selectedUser.id);
    if (res.success) {
      showToast(`ลบผู้ใช้ "${selectedUser.username}" เรียบร้อย`, 'success');
      setIsDeleteModalOpen(false);
    } else {
      showToast(res.error || 'ไม่สามารถลบผู้ใช้ได้', 'error');
    }
  };

  const handleSwitchUser = (uname: string) => {
    const ok = switchUser(uname);
    if (ok) {
      showToast(`สลับบัญชีผู้ใช้งานเป็น "${uname}" สำเร็จ`, 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="การจัดการผู้ใช้งานระบบ (User Management CRUD)"
        subtitle={`รวมทั้งหมด ${users.length} บัญชีผู้ใช้ · สิทธิ์ตามบทบาท (Role-based Access)`}
        actionButton={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มผู้ใช้ใหม่ (Create User)</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* KPI Tiles (4 metrics) */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile
            label="ผู้ใช้ทั้งหมดในระบบ"
            value={users.length}
            variant="default"
          />
          <KpiTile
            label="สถานะพร้อมใช้งาน (Active)"
            value={activeCount}
            variant="success"
          />
          <KpiTile
            label="ระงับการใช้งาน (Inactive)"
            value={inactiveCount}
            variant={inactiveCount > 0 ? 'warning' : 'default'}
          />
          <KpiTile
            label="ผู้ดูแลระบบ (Admin / SysAdmin)"
            value={sysAdminCount}
            variant="default"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-card border border-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, อีเมล หรือแผนก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter by Role */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="sysadmin">sysadmin</option>
                <option value="admin">admin</option>
                <option value="SF_1">SF_1 (Sales)</option>
                <option value="SF_2">SF_2 (Service)</option>
                <option value="SF_3">SF_3 (Credit)</option>
                <option value="supervisor">supervisor</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span>สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="active">Active (ใช้งาน)</option>
                <option value="inactive">Inactive (ระงับ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
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
                  <th className="px-4 py-3 font-medium text-center">สถานะ</th>
                  <th className="px-4 py-3 font-medium">เข้าสู่ระบบล่าสุด</th>
                  <th className="px-4 py-3 font-medium text-right">การจัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-bg-subtle transition-colors ${isCurrent ? 'bg-brand-tint/20' : ''}`}>
                      {/* Name & Avatar */}
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
                              {isCurrent && (
                                <span className="text-[10px] bg-brand text-white px-1.5 py-0.2 rounded font-semibold">
                                  คุณ (You)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">
                        {u.username}
                      </td>

                      {/* Password */}
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        <span className="bg-bg-app px-2 py-0.5 rounded border border-border">
                          {u.password}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-text-body2">
                        {u.department}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          disabled={isCurrent}
                          title={isCurrent ? 'ไม่สามารถเปลี่ยนสถานะตัวเองได้' : 'คลิกเพื่อเปลี่ยนสถานะ'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          } ${isCurrent ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 text-[11px] font-mono text-text-secondary">
                        {u.lastLogin || '—'}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Switch User Button */}
                          {!isCurrent && u.status === 'active' && (
                            <button
                              onClick={() => handleSwitchUser(u.username)}
                              title={`สลับเข้าใช้งานเป็น ${u.username}`}
                              className="p-1 text-brand hover:text-brand-hover hover:bg-brand-tint rounded transition-colors"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title="รีเซ็ตรหัสผ่าน"
                            className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="แก้ไขข้อมูลผู้ใช้"
                            className="p-1 text-text-secondary hover:text-brand hover:bg-bg-app rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrent}
                            title={isCurrent ? 'ไม่สามารถลบบัญชีตัวเองได้' : 'ลบผู้ใช้'}
                            className={`p-1 rounded transition-colors ${
                              isCurrent
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-text-secondary hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= MODAL: CREATE USER ================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="เพิ่มบัญชีผู้ใช้งานใหม่ (Create New User)"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateSubmit}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              บันทึกสร้างผู้ใช้
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                ชื่อผู้ใช้ (Username) *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="เช่น SF_4, agent_smith"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                รหัสผ่าน (Password) *
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="1234"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ชื่อ-นามสกุล (Full Name) *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น ณัฐวุฒิ สิทธิชัย"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              อีเมล (Email)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@cb360.co.th"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                บทบาท (Role) *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
              >
                <option value="sysadmin">sysadmin (System Administrator)</option>
                <option value="admin">admin (Administrator)</option>
                <option value="SF_1">SF_1 (Sales Force - Sales/Pipeline)</option>
                <option value="SF_2">SF_2 (Sales Force - Service/Inbox)</option>
                <option value="SF_3">SF_3 (Sales Force - Credit Sales)</option>
                <option value="supervisor">supervisor (Supervisor)</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">
                สถานะ (Status)
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="active">Active (เปิดใช้งาน)</option>
                <option value="inactive">Inactive (ระงับชั่วคราว)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              แผนก / ฝ่ายงาน (Department)
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="เช่น ฝ่ายพัฒนาธุรกิจและการขาย"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT USER ================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`แก้ไขข้อมูลผู้ใช้: ${selectedUser?.username}`}
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleEditSubmit}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              บันทึกการแก้ไข
            </button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ชื่อ-นามสกุล (Full Name) *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              อีเมล (Email)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                บทบาท (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
              >
                <option value="sysadmin">sysadmin</option>
                <option value="admin">admin</option>
                <option value="SF_1">SF_1 (Sales)</option>
                <option value="SF_2">SF_2 (Service)</option>
                <option value="SF_3">SF_3 (Credit)</option>
                <option value="supervisor">supervisor</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">
                สถานะ (Status)
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              แผนก / ฝ่ายงาน
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: RESET PASSWORD ================= */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={`รีเซ็ตรหัสผ่านสำหรับ: ${selectedUser?.username}`}
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleResetPasswordSubmit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              ยืนยันเปลี่ยนรหัสผ่าน
            </button>
          </>
        }
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
          <p className="text-text-secondary">
            กำหนดรหัสผ่านใหม่สำหรับผู้ใช้ <strong>{selectedUser?.name}</strong> ({selectedUser?.username})
          </p>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              รหัสผ่านใหม่ (New Password) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่ เช่น 1234"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-text-secondary mt-1 block">
              กดปุ่มด้านล่างเพื่อตั้งค่าเป็น 1234 ทันที:
            </span>
            <button
              type="button"
              onClick={() => setNewPasswordInput('1234')}
              className="mt-1 text-xs px-2 py-0.5 rounded bg-bg-subtle border border-border text-brand font-mono font-bold"
            >
              ใช้รหัส 1234
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: DELETE USER CONFIRMATION ================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบบัญชีผู้ใช้"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDeleteSubmit}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              ยืนยันลบผู้ใช้
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-primary">
            คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ <strong>{selectedUser?.name}</strong> (<span className="font-mono">{selectedUser?.username}</span>)?
          </p>
          <div className="p-3 bg-danger-bg border border-danger-border rounded-lg text-danger-text text-[11px]">
            ⚠️ การลบจะทำให้ผู้ใช้นี้ไม่สามารถเข้าสู่ระบบได้อีกต่อไป
          </div>
        </div>
      </Modal>

    </div>
  );
};
