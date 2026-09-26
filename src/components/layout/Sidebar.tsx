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
  Network,
  Settings,
  UserCog,
  LogOut,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCustomerId } = useCustomer();
  const { currentUser, logout, switchUser, users } = useAuth();
  const { showToast } = useToast();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cdpNavItems = [
    {
      name: 'ลูกค้า (Customer 360)',
      path: `/customers/${selectedCustomerId || 'C00123'}`,
      activeMatch: '/customers',
      icon: Users,
    },
    {
      name: 'Segments',
      path: '/segments',
      activeMatch: '/segments',
      icon: Layers,
    },
    {
      name: 'Tier & Loyalty',
      path: '/tiers',
      activeMatch: '/tiers',
      icon: Award,
    },
    {
      name: 'Consent',
      path: '/consent',
      activeMatch: '/consent',
      icon: ShieldCheck,
    },
  ];

  const activityNavItems = [
    {
      name: 'Sales Pipeline',
      path: '/pipeline',
      activeMatch: '/pipeline',
      icon: Kanban,
    },
    {
      name: 'Omnichannel Inbox',
      path: '/inbox',
      activeMatch: '/inbox',
      icon: MessageSquare,
      badge: '8',
    },
    {
      name: 'Service / Case',
      path: '/cases',
      activeMatch: '/cases',
      icon: Headphones,
    },
    {
      name: 'Voice (3CX)',
      path: '/voice',
      activeMatch: '/voice',
      icon: PhoneCall,
    },
    {
      name: 'Credit Sales',
      path: '/credit',
      activeMatch: '/credit',
      icon: CreditCard,
    },
  ];

  const bottomNavItems = [
    {
      name: 'ผู้ใช้งาน (User CRUD)',
      path: '/users',
      activeMatch: '/users',
      icon: UserCog,
    },
    {
      name: 'Connectors',
      path: '/connectors',
      activeMatch: '/connectors',
      icon: Network,
    },
    {
      name: 'ตั้งค่า',
      path: '/settings',
      activeMatch: '/settings',
      icon: Settings,
    },
  ];

  const isItemActive = (activeMatch: string) => {
    return location.pathname.startsWith(activeMatch);
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
    <aside className="w-[232px] flex-shrink-0 bg-sidebar-bg border-r border-sidebar-border h-screen flex flex-col justify-between p-[18px_12px] select-none z-30">
      <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-8 px-2 rounded-lg bg-brand text-white font-bold text-[13px] flex items-center justify-center tracking-wider shadow-sm">
            CB360
          </div>
          <span className="font-bold text-[18px] text-[#0F2B4D] tracking-tight">
            CusBox360
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-4">
          {/* Section 1: CDP */}
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-bold text-sidebar-label tracking-[1px] uppercase">
              CDP · ข้อมูลลูกค้า
            </div>
            <nav className="flex flex-col gap-0.5">
              {cdpNavItems.map((item) => {
                const active = isItemActive(item.activeMatch);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                      active
                        ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                        : 'text-sidebar-text hover:bg-white/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section 2: ACTIVITY */}
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-bold text-sidebar-label tracking-[1px] uppercase">
              ACTIVITY
            </div>
            <nav className="flex flex-col gap-0.5">
              {activityNavItems.map((item) => {
                const active = isItemActive(item.activeMatch);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                      active
                        ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                        : 'text-sidebar-text hover:bg-white/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                      <span>{item.name}</span>
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
        </div>
      </div>

      {/* Bottom Area: Settings, User CRUD & Active Profile */}
      <div className="flex flex-col gap-2 pt-3 border-t border-sidebar-border/80 flex-shrink-0 relative">
        <nav className="flex flex-col gap-0.5">
          {bottomNavItems.map((item) => {
            const active = isItemActive(item.activeMatch);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                  active
                    ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active'
                    : 'text-sidebar-text hover:bg-white/60 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-sidebar-label'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Current User Card + Popover Menu */}
        <div className="relative pt-1">
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/70 cursor-pointer transition-colors border border-transparent hover:border-sidebar-border"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 text-brand-deep shadow-xs"
                style={{ backgroundColor: displayUser.avatarBg || '#CFE2F8' }}
              >
                {displayUser.initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary truncate">
                  {displayUser.name}
                </span>
                <span className="text-[11px] text-sidebar-label font-mono leading-tight truncate">
                  {displayUser.role}
                </span>
              </div>
            </div>

            {isUserMenuOpen ? (
              <ChevronUp className="w-4 h-4 text-sidebar-label flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-sidebar-label flex-shrink-0" />
            )}
          </div>

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-border rounded-xl shadow-xl p-2.5 z-50 text-xs animate-in zoom-in-95 space-y-2">
              <div className="px-1 py-0.5 border-b border-divider text-[11px] text-text-secondary font-semibold">
                สลับผู้ใช้งาน (Switch Role):
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSwitchUser(u.username)}
                    className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      u.username === displayUser.username
                        ? 'bg-brand-tint text-brand-deep font-bold'
                        : 'hover:bg-bg-subtle text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-[11px]">{u.username}</span>
                      <span className="text-[10px] text-text-secondary truncate">({u.role})</span>
                    </div>
                    {u.username === displayUser.username && (
                      <UserCheck className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-1.5 border-t border-divider">
                <button
                  onClick={handleLogout}
                  className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ (Sign Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
