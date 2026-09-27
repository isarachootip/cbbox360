import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Users,
  Award,
  Kanban,
  MessageSquare,
  Headphones,
  PhoneCall,
  CreditCard,
  UserCog,
  Network,
  Settings,
  BarChart3,
  FileText,
  Bot,
  Compass,
  Bookmark,
  Sparkles,
  FolderKanban,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MenuItemConfig, UserRole, MenuSection } from '../types';

export const MenuManagementPage: React.FC = () => {
  const {
    menus,
    createMenu,
    updateMenu,
    deleteMenu,
    toggleRoleAccess,
    enableAllForRole,
    disableAllForRole,
    resetToDefaults,
  } = useMenu();
  const { currentUser, switchUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'matrix' | 'crud' | 'preview'>('matrix');
  const [sectionFilter, setSectionFilter] = useState<string>('ทั้งหมด');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);

  // Selected item for action
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemConfig | null>(null);

  // Preview selected role
  const [previewRole, setPreviewRole] = useState<UserRole>('SF_1');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: 'Layers',
    section: 'ACTIVITY' as MenuSection,
    order: 1,
    badge: '',
    description: '',
    allowedRoles: ['sysadmin', 'admin', 'SF_1', 'supervisor'] as UserRole[],
  });

  const rolesList: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'sysadmin', label: 'sysadmin', desc: 'ผู้ดูแลระบบระดับสูง', color: 'purple' },
    { role: 'admin', label: 'admin', desc: 'ผู้ดูแลระบบกลาง', color: 'blue' },
    { role: 'SF_1', label: 'SF_1 (Sales)', desc: 'ทีมขาย & ลูกค้าสัมพันธ์', color: 'emerald' },
    { role: 'SF_2', label: 'SF_2 (Service)', desc: 'ทีมบริการ & Customer Care', color: 'cyan' },
    { role: 'SF_3', label: 'SF_3 (Credit)', desc: 'ทีมสินเชื่อ & การเงิน', color: 'amber' },
    { role: 'supervisor', label: 'supervisor', desc: 'หัวหน้างาน & ตรวจสอบ', color: 'indigo' },
  ];

  const iconOptions = [
    { name: 'Users', icon: Users, label: 'Users' },
    { name: 'Layers', icon: Layers, label: 'Layers' },
    { name: 'Award', icon: Award, label: 'Award' },
    { name: 'ShieldCheck', icon: ShieldCheck, label: 'ShieldCheck' },
    { name: 'Kanban', icon: Kanban, label: 'Kanban' },
    { name: 'MessageSquare', icon: MessageSquare, label: 'MessageSquare' },
    { name: 'Headphones', icon: Headphones, label: 'Headphones' },
    { name: 'PhoneCall', icon: PhoneCall, label: 'PhoneCall' },
    { name: 'CreditCard', icon: CreditCard, label: 'CreditCard' },
    { name: 'UserCog', icon: UserCog, label: 'UserCog' },
    { name: 'Network', icon: Network, label: 'Network' },
    { name: 'Settings', icon: Settings, label: 'Settings' },
    { name: 'BarChart3', icon: BarChart3, label: 'BarChart3' },
    { name: 'FileText', icon: FileText, label: 'FileText' },
    { name: 'Bot', icon: Bot, label: 'Bot' },
    { name: 'Compass', icon: Compass, label: 'Compass' },
    { name: 'Bookmark', icon: Bookmark, label: 'Bookmark' },
    { name: 'FolderKanban', icon: FolderKanban, label: 'FolderKanban' },
    { name: 'Sparkles', icon: Sparkles, label: 'Sparkles' },
    { name: 'Menu', icon: Menu, label: 'Menu' },
  ];

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Layers;
    return <IconComp className="w-4 h-4" />;
  };

  const filteredMenus = menus.filter((m) => {
    if (sectionFilter === 'ทั้งหมด') return true;
    return m.section === sectionFilter;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      path: '',
      icon: 'Layers',
      section: 'ACTIVITY',
      order: menus.length + 1,
      badge: '',
      description: '',
      allowedRoles: ['sysadmin', 'admin', 'SF_1', 'supervisor'],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (m: MenuItemConfig) => {
    setSelectedMenuItem(m);
    setFormData({
      name: m.name,
      path: m.path,
      icon: m.icon,
      section: m.section,
      order: m.order,
      badge: m.badge || '',
      description: m.description || '',
      allowedRoles: [...m.allowedRoles],
    });
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (m: MenuItemConfig) => {
    setSelectedMenuItem(m);
    setIsDeleteModalOpen(true);
  };

  // Save Create
  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createMenu(formData);
    if (res.success) {
      showToast(`สร้างเมนู "${formData.name}" เรียบร้อยแล้ว`, 'success');
      setIsCreateModalOpen(false);
    } else {
      showToast(res.error || 'ไม่สามารถสร้างเมนูได้', 'error');
    }
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    const res = updateMenu(selectedMenuItem.id, formData);
    if (res.success) {
      showToast(`อัปเดตเมนู "${formData.name}" เรียบร้อยแล้ว`, 'success');
      setIsEditModalOpen(false);
    } else {
      showToast(res.error || 'ไม่สามารถบันทึกเมนูได้', 'error');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!selectedMenuItem) return;
    const res = deleteMenu(selectedMenuItem.id);
    if (res.success) {
      showToast(`ลบเมนู "${selectedMenuItem.name}" เรียบร้อย`, 'success');
      setIsDeleteModalOpen(false);
    } else {
      showToast(res.error || 'ไม่สามารถลบเมนูได้', 'error');
    }
  };

  // Reset to Defaults
  const handleConfirmReset = () => {
    resetToDefaults();
    showToast('รีเซ็ตสิทธิ์เมนูทุก Role กลับเป็นค่าเริ่มต้นเรียบร้อย', 'info');
    setIsResetConfirmModalOpen(false);
  };

  // Toggle role in form
  const handleToggleFormRole = (role: UserRole) => {
    setFormData((prev) => {
      const has = prev.allowedRoles.includes(role);
      return {
        ...prev,
        allowedRoles: has ? prev.allowedRoles.filter((r) => r !== role) : [...prev.allowedRoles, role],
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header - CLEAN */}
      <PageHeader
        title="Menu Management"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResetConfirmModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-text-secondary" />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มเมนูใหม่ (Create Menu)</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile
            label="เมนูทั้งหมดในระบบ"
            value={menus.length}
            variant="default"
          />
          <KpiTile
            label="เมนู Sales (SF_1)"
            value={`${menus.filter((m) => m.allowedRoles.includes('SF_1')).length} เมนู`}
            variant="success"
          />
          <KpiTile
            label="เมนู Service (SF_2)"
            value={`${menus.filter((m) => m.allowedRoles.includes('SF_2')).length} เมนู`}
            variant="default"
          />
          <KpiTile
            label="เมนู Credit (SF_3)"
            value={`${menus.filter((m) => m.allowedRoles.includes('SF_3')).length} เมนู`}
            variant="default"
          />
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex items-center justify-between bg-white rounded-card border border-border p-2 shadow-card">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:bg-bg-subtle'
              }`}
            >
              ตารางสิทธิ์ตาม Role (Access Matrix)
            </button>
            <button
              onClick={() => setActiveTab('crud')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'crud'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:bg-bg-subtle'
              }`}
            >
              จัดการรายการเมนู (CRUD Menus)
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:bg-bg-subtle'
              }`}
            >
              จำลองมุมมอง Sidebar (Live Preview)
            </button>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1">
            {['ทั้งหมด', 'CDP', 'ACTIVITY', 'ADMINISTRATION'].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`text-[11px] px-2.5 py-1 rounded font-medium transition-all ${
                  sectionFilter === sec
                    ? 'bg-bg-muted font-bold text-text-primary border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* ================= TAB 1: ROLE ACCESS MATRIX ================= */}
        {activeTab === 'matrix' && (
          <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-bg-subtle border-b border-border text-text-secondary font-bold">
                    <th className="py-3 px-4 w-[280px]">เมนู / หมวดหมู่</th>
                    <th className="py-3 px-2 w-[110px] text-center">Section</th>
                    {rolesList.map((r) => (
                      <th key={r.role} className="py-3 px-3 text-center border-l border-divider min-w-[110px]">
                        <div>
                          <span className="font-mono text-text-primary font-bold">{r.label}</span>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <button
                              onClick={() => enableAllForRole(r.role)}
                              title="เปิดทุกเมนู"
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              เปิดหมด
                            </button>
                            <button
                              onClick={() => disableAllForRole(r.role)}
                              title="ปิดทุกเมนู"
                              className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              ปิดหมด
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredMenus.map((m) => {
                    return (
                      <tr key={m.id} className="hover:bg-bg-subtle/60 transition-colors">
                        {/* Menu Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-bg-muted flex items-center justify-center text-text-secondary border border-border flex-shrink-0">
                              {getIconComponent(m.icon)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-text-primary text-xs truncate">{m.name}</span>
                                {m.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                    {m.badge}
                                  </span>
                                )}
                                {!m.isSystem && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-text-secondary truncate block">
                                {m.path}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Section */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              m.section === 'CDP'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : m.section === 'ACTIVITY'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {m.section}
                          </span>
                        </td>

                        {/* Checkbox columns for each role */}
                        {rolesList.map((r) => {
                          const isChecked = m.allowedRoles.includes(r.role);
                          return (
                            <td key={r.role} className="py-3 px-3 text-center border-l border-divider">
                              <button
                                type="button"
                                onClick={() => toggleRoleAccess(m.id, r.role)}
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                                  isChecked
                                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs hover:bg-emerald-600'
                                    : 'bg-white border-border text-gray-300 hover:border-gray-400 hover:text-gray-400'
                                }`}
                              >
                                {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MENU ITEM CRUD ================= */}
        {activeTab === 'crud' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMenus.map((m) => {
                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-card border border-border p-4 shadow-card flex flex-col justify-between hover:border-brand/40 transition-all space-y-3"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-brand-tint text-brand flex items-center justify-center flex-shrink-0 shadow-xs">
                            {getIconComponent(m.icon)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[13px] text-text-primary truncate flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {m.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-brand font-medium truncate">
                              {m.path}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                            m.section === 'CDP'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : m.section === 'ACTIVITY'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {m.section}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-text-secondary mt-2.5 line-clamp-2">
                        {m.description || 'ไม่มีคำอธิบาย'}
                      </p>
                    </div>

                    {/* Roles Granted */}
                    <div className="pt-2 border-t border-divider space-y-2">
                      <div className="text-[11px] font-bold text-text-primary">
                        สิทธิ์การเข้าถึง ({m.allowedRoles.length} / 6 Roles):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rolesList.map((r) => {
                          const has = m.allowedRoles.includes(r.role);
                          return (
                            <span
                              key={r.role}
                              onClick={() => toggleRoleAccess(m.id, r.role)}
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all border ${
                                has
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                              }`}
                            >
                              {r.role}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-divider flex items-center justify-between">
                      <span className="text-[11px] font-mono text-text-secondary">
                        ลำดับที่: {m.order}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="px-2.5 py-1 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-text-secondary" />
                          <span>แก้ไข</span>
                        </button>
                        {!m.isSystem && (
                          <button
                            onClick={() => handleOpenDelete(m)}
                            className="px-2.5 py-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ลบ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LIVE ROLE PREVIEW ================= */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left selector */}
            <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-3">
              <div className="font-bold text-text-primary text-xs">เลือก Role เพื่อทดสอบมุมมอง Sidebar</div>
              <div className="space-y-1.5">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setPreviewRole(r.role)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                      previewRole === r.role
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-white border-border hover:bg-bg-subtle text-text-primary'
                    }`}
                  >
                    <div>
                      <div className="font-bold font-mono text-xs">{r.label}</div>
                      <div className={`text-[11px] ${previewRole === r.role ? 'text-white/80' : 'text-text-secondary'}`}>
                        {r.desc}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/10">
                      {menus.filter((m) => m.allowedRoles.includes(r.role)).length} เมนู
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Mock Sidebar */}
            <div className="md:col-span-2 bg-white rounded-card border border-border p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-divider">
                <div>
                  <h4 className="font-bold text-text-primary text-sm">
                    ตัวอย่าง Sidebar ของ Role: <span className="text-brand font-mono">{previewRole}</span>
                  </h4>
                  <p className="text-xs text-text-secondary">
                    เมนูที่ผู้ใช้กลุ่มนี้มองเห็นและสามารถคลิกใช้งานได้จริง
                  </p>
                </div>
                <button
                  onClick={() => {
                    const matchedUser = rolesList.find((r) => r.role === previewRole);
                    if (matchedUser) {
                      switchUser(previewRole);
                      showToast(`สลับบัญชีผู้ใช้เป็น ${previewRole} เรียบร้อยแล้ว`, 'success');
                    }
                  }}
                  className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ทดสอบสลับ Role จริง</span>
                </button>
              </div>

              {/* Mock Sidebar Sections */}
              <div className="max-w-xs bg-sidebar-bg border border-sidebar-border rounded-xl p-3 text-white space-y-4 shadow-inner">
                {/* CDP Section */}
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-sidebar-textDim px-3 py-1">
                    CDP
                  </div>
                  <div className="space-y-1">
                    {menus
                      .filter((m) => m.section === 'CDP' && m.allowedRoles.includes(previewRole))
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-text bg-sidebar-hover/40"
                        >
                          {getIconComponent(m.icon)}
                          <span className="truncate">{m.name}</span>
                        </div>
                      ))}
                    {menus.filter((m) => m.section === 'CDP' && m.allowedRoles.includes(previewRole)).length === 0 && (
                      <div className="text-[11px] text-sidebar-textDim px-3 py-1 italic">
                        (ไม่มีสิทธิ์เข้าถึงเมนูในหมวดนี้)
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVITY Section */}
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-sidebar-textDim px-3 py-1">
                    ACTIVITY
                  </div>
                  <div className="space-y-1">
                    {menus
                      .filter((m) => m.section === 'ACTIVITY' && m.allowedRoles.includes(previewRole))
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-sidebar-text bg-sidebar-hover/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getIconComponent(m.icon)}
                            <span className="truncate">{m.name}</span>
                          </div>
                          {m.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-slate-900">
                              {m.badge}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* ADMINISTRATION Section */}
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-sidebar-textDim px-3 py-1">
                    ADMINISTRATION
                  </div>
                  <div className="space-y-1">
                    {menus
                      .filter((m) => m.section === 'ADMINISTRATION' && m.allowedRoles.includes(previewRole))
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-text bg-sidebar-hover/40"
                        >
                          {getIconComponent(m.icon)}
                          <span className="truncate">{m.name}</span>
                        </div>
                      ))}
                    {menus.filter((m) => m.section === 'ADMINISTRATION' && m.allowedRoles.includes(previewRole)).length === 0 && (
                      <div className="text-[11px] text-sidebar-textDim px-3 py-1 italic">
                        (ไม่มีสิทธิ์เข้าถึงเมนูจัดการระบบ)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL: CREATE / EDIT MENU ================= */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={isCreateModalOpen ? 'เพิ่มเมนูใหม่ในระบบ' : `แก้ไขเมนู: ${formData.name}`}
          maxWidth="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={isCreateModalOpen ? handleSaveCreate : handleSaveEdit}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                {isCreateModalOpen ? 'บันทึกเมนูใหม่' : 'บันทึกการแก้ไข'}
              </button>
            </>
          }
        >
          <form onSubmit={isCreateModalOpen ? handleSaveCreate : handleSaveEdit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  ชื่อเมนู (Menu Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น รายงานยอดขาย, Marketing Hub"
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Route Path *
                </label>
                <input
                  type="text"
                  required
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/reports หรือ /marketing"
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  หมวดหมู่ (Section) *
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value as MenuSection })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
                >
                  <option value="CDP">CDP</option>
                  <option value="ACTIVITY">ACTIVITY</option>
                  <option value="ADMINISTRATION">ADMINISTRATION</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  ไอคอน (Icon) *
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
                >
                  {iconOptions.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Badge (ป้ายกำกับ)
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="เช่น NEW, 8, PRO"
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">
                คำอธิบายเมนู (Description)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="คำอธิบายสั้นๆ เกี่ยวกับฟังก์ชันการทำงานของเมนูนี้"
                className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand"
              />
            </div>

            {/* Role Access Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-divider">
              <div className="font-bold text-text-primary text-xs">
                กำหนด Role ที่สามารถเข้าถึงเมนูนี้ได้:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rolesList.map((r) => {
                  const isChecked = formData.allowedRoles.includes(r.role);
                  return (
                    <label
                      key={r.role}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-white border-border text-text-secondary hover:bg-bg-subtle'
                      }`}
                    >
                      <div>
                        <div className="font-mono text-xs">{r.label}</div>
                        <div className="text-[10px] text-text-secondary">{r.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleFormRole(r.role)}
                        className="w-4 h-4 text-emerald-600 rounded border-border focus:ring-emerald-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {selectedMenuItem && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="ยืนยันการลบเมนู"
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
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </>
          }
        >
          <div className="space-y-2 text-xs">
            <p className="text-text-primary">
              ท่านต้องการลบเมนู <strong className="text-rose-600">"{selectedMenuItem.name}"</strong> ใช่หรือไม่?
            </p>
            <p className="text-text-secondary text-[11px]">
              เมื่อลบแล้ว ผู้ใช้งานทุก Role จะไม่สามารถมองเห็นหรือเข้าถึงเมนูนี้ได้อีกต่อไป
            </p>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: RESET CONFIRMATION ================= */}
      <Modal
        isOpen={isResetConfirmModalOpen}
        onClose={() => setIsResetConfirmModalOpen(false)}
        title="ยืนยันการรีเซ็ตสิทธิ์เมนู"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => setIsResetConfirmModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmReset}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              รีเซ็ตค่าเริ่มต้น
            </button>
          </>
        }
      >
        <div className="space-y-2 text-xs">
          <p className="text-text-primary">
            ท่านต้องการรีเซ็ตโครงสร้างเมนูและสิทธิ์ของทุก Role กลับเป็นค่าเริ่มต้นใช่หรือไม่?
          </p>
        </div>
      </Modal>

    </div>
  );
};
