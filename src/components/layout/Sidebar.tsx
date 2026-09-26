import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { selectedCustomerId } = useCustomer();

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

  return (
    <aside className="w-[232px] flex-shrink-0 bg-sidebar-bg border-r border-sidebar-border h-screen flex flex-col justify-between p-[20px_12px] select-none z-30">
      <div className="flex flex-col gap-6">
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
        <div className="flex flex-col gap-5">
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
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all ${
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
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all ${
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

      {/* Bottom Area: Settings & User Profile */}
      <div className="flex flex-col gap-4 pt-4 border-t border-sidebar-border/80">
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

        {/* Current User Card */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-[#CFE2F8] text-brand-deep font-bold text-xs flex items-center justify-center flex-shrink-0">
            สญ
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              สมหญิง ร.
            </span>
            <span className="text-[11px] text-sidebar-label leading-tight">
              Supervisor
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
