import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  Award,
  ShieldCheck,
  Kanban,
  MessageSquare,
  Headphones,
  PhoneCall,
  CreditCard,
  UserCog,
  Network,
  Settings,
  Menu,
  BarChart3,
  FileText,
  Bot,
  Compass,
  Bookmark,
  Sparkles,
  FolderKanban,
  LogOut,
  ChevronDown,
  ChevronUp,
  UserCheck,
  X,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { useToast } from '../../context/ToastContext';
import { useLayout } from '../../context/LayoutContext';
import { MenuItemConfig, UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCustomerId } = useCustomer();
  const { currentUser, logout, switchUser, users } = useAuth();
  const { menus, getMenusByRole } = useMenu();
  const { showToast } = useToast();

  const { isMobileSidebarOpen, closeMobileSidebar } = useLayout();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Icon Map
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Users,
    Layers,
    Award,
    ShieldCheck,
    Kanban,
    MessageSquare,
    Headphones,
    PhoneCall,
    CreditCard,
    UserCog,
    Network,
    Settings,
    Menu,
    BarChart3,
    FileText,
    Bot,
    Compass,
    Bookmark,
    Sparkles,
    FolderKanban,
  };

  const userRole: UserRole = currentUser?.role || 'sysadmin';

  // Filter and group menus by role
  const roleMenus = getMenusByRole(userRole);

  const cdpMenus = roleMenus.filter((m) => m.section === 'CDP');
  const activityMenus = roleMenus.filter((m) => m.section === 'ACTIVITY');
  const adminMenus = roleMenus.filter((m) => m.section === 'ADMINISTRATION');

  const isItemActive = (path: string, activeMatch?: string) => {
    if (activeMatch) {
      return location.pathname.startsWith(activeMatch);
    }
    return location.pathname === path;
  };

  const getResolvedPath = (item: MenuItemConfig) => {
    if (item.id === 'menu-customer360') {
      return '/customers';
    }
    if (item.path.includes('/customers/')) {
      return `/customers/${selectedCustomerId || 'C00123'}`;
    }
    return item.path;
  };

  const handleLogout = () => {
    logout();
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    navigate('/login');
  };

  const handleSwitchUser = (username: string) => {
    const success = switchUser(username);
    if (success) {
      showToast(`สลับใช้งานเป็น "${username}" แล้ว`, 'success');
      setIsUserMenuOpen(false);
    }
  };

  // Fallback if currentUser is somehow null
  const displayUser = currentUser || {
    name: 'สมศักดิ์ บริหารระบบ',
    initials: 'SA',
    role: 'sysadmin',
    username: 'sysadmin',
    avatarBg: '#CFE2F8',
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-sidebar-bg border-r border-sidebar-border h-screen flex flex-col justify-between p-[18px_12px] select-none z-50 transition-transform duration-300 ease-in-out lg:static lg:w-[232px] lg:translate-x-0 lg:z-30 flex-shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          {/* Framed Logo & Mobile Close Button */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-white border border-sidebar-border shadow-sm flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="CustBox360 Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-[17px] text-[#0F2B4D] tracking-tight leading-none">
                  CustBox360
                </span>
                <span className="text-[10px] text-sidebar-label font-medium tracking-wide mt-0.5">
                  CDP & Activity
                </span>
              </div>
            </div>

            {/* Close button for mobile drawer */}
            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="ปิดเมนูการนำทาง"
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-4">
          {/* Section 1: CDP */}
          {cdpMenus.length > 0 && (
            <div>
              <div className="px-2.5 mb-1.5 text-[11px] font-bold text-sidebar-label tracking-[1px] uppercase">
                CDP
              </div>
              <nav className="flex flex-col gap-0.5">
                {cdpMenus.map((item) => {
                  const resolvedPath = getResolvedPath(item);
                  const active = isItemActive(resolvedPath, item.activeMatch);
                  const IconComp = iconMap[item.icon] || Layers;
                  return (
                    <NavLink
                      key={item.id}
                      to={resolvedPath}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                        active
                          ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                          : 'text-sidebar-text hover:bg-white/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#B4480A] text-white rounded-full leading-none">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Section 2: ACTIVITY */}
          {activityMenus.length > 0 && (
            <div>
              <div className="px-2.5 mb-1.5 text-[11px] font-bold text-sidebar-label tracking-[1px] uppercase">
                ACTIVITY
              </div>
              <nav className="flex flex-col gap-0.5">
                {activityMenus.map((item) => {
                  const resolvedPath = getResolvedPath(item);
                  const active = isItemActive(resolvedPath, item.activeMatch);
                  const IconComp = iconMap[item.icon] || Kanban;
                  return (
                    <NavLink
                      key={item.id}
                      to={resolvedPath}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                        active
                          ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                          : 'text-sidebar-text hover:bg-white/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#B4480A] text-white rounded-full leading-none">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: ADMINISTRATION */}
      {adminMenus.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-sidebar-border/80 flex-shrink-0 relative">
          <div className="px-2.5 mb-0.5 text-[10px] font-bold text-sidebar-label tracking-[1px] uppercase">
            ADMINISTRATION
          </div>
          <nav className="flex flex-col gap-0.5">
            {adminMenus.map((item) => {
              const resolvedPath = getResolvedPath(item);
              const active = isItemActive(resolvedPath, item.activeMatch);
              const IconComp = iconMap[item.icon] || Settings;
              return (
                <NavLink
                  key={item.id}
                  to={resolvedPath}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all ${
                    active
                      ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                      : 'text-sidebar-text hover:bg-white/60 font-medium'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      {/* User Switcher / Profile Box */}
      <div className="mt-3 pt-3 border-t border-sidebar-border/80 flex-shrink-0 relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white/50 hover:bg-white border border-sidebar-border/60 transition-all text-left shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-brand border border-brand/20 flex-shrink-0 shadow-xs"
              style={{ backgroundColor: displayUser.avatarBg || '#CFE2F8' }}
            >
              {displayUser.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary truncate">
                {displayUser.name}
              </span>
              <span className="text-[11px] font-mono text-brand font-medium truncate">
                {displayUser.role}
              </span>
            </div>
          </div>
          {isUserMenuOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-border rounded-xl shadow-xl p-2 z-50 space-y-2">
            <div className="text-[11px] font-bold text-text-secondary px-2 pt-1">
              สลับบัญชีผู้ใช้งาน (Quick Switch):
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u.username)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-brand-tint text-brand font-semibold'
                        : 'hover:bg-bg-subtle text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: u.avatarBg || '#CFE2F8' }}
                      >
                        {u.initials}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="truncate text-xs">{u.name}</div>
                        <div className="text-[10px] font-mono text-text-secondary">{u.role}</div>
                      </div>
                    </div>
                    {isCurrent && <UserCheck className="w-3.5 h-3.5 text-brand flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-divider">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
);
};
