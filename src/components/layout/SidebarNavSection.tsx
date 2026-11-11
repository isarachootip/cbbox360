import React, { useState } from 'react';
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
} from 'lucide-react';
import { MenuItemConfig } from '../../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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

interface SidebarNavSectionProps {
  title: string;
  items: MenuItemConfig[];
  selectedCustomerId?: string;
  isCollapsed?: boolean;
  compactText?: boolean;
}

interface TooltipState {
  label: string;
  badge?: string | number;
  top: number;
  left: number;
}

export const SidebarNavSection: React.FC<SidebarNavSectionProps> = ({
  title,
  items,
  selectedCustomerId,
  isCollapsed = false,
  compactText = false,
}) => {
  const location = useLocation();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (items.length === 0) return null;

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

  return (
    <div>
      {!isCollapsed ? (
        <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-sidebar-label tracking-[0.08em] uppercase">
          {title}
        </div>
      ) : (
        <div className="mx-auto mb-2 w-6 border-t border-sidebar-border/80" aria-hidden="true" />
      )}

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const resolvedPath = getResolvedPath(item);
          const active = isItemActive(resolvedPath, item.activeMatch);
          const IconComp = ICON_MAP[item.icon] || Layers;

          return (
            <NavLink
              key={item.id}
              to={resolvedPath}
              onMouseEnter={(e) => {
                if (!isCollapsed) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  label: item.name,
                  badge: item.badge,
                  top: rect.top + rect.height / 2,
                  left: rect.right + 10,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              className={`relative flex items-center transition-all rounded-lg ${
                isCollapsed
                  ? 'justify-center w-10 h-10 mx-auto'
                  : `justify-between px-2.5 py-2 ${compactText ? 'text-[13px]' : 'text-[13.5px]'}`
              } ${
                active
                  ? 'bg-white text-brand-hover font-semibold shadow-sidebar-active ring-1 ring-brand/15'
                  : 'text-sidebar-text hover:bg-white/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconComp
                  className={`w-[17px] h-[17px] flex-shrink-0 ${
                    active ? 'text-brand' : 'text-sidebar-label'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#B4480A] text-white rounded-full leading-none">
                  {item.badge}
                </span>
              )}

              {isCollapsed && item.badge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[9px] font-mono font-bold bg-[#B4480A] text-white rounded-full flex items-center justify-center ring-2 ring-sidebar-bg">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isCollapsed && tooltip && (
        <div
          style={{ top: tooltip.top, left: tooltip.left }}
          className="hidden lg:flex fixed -translate-y-1/2 z-[70] pointer-events-none items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg whitespace-nowrap"
        >
          <span>{tooltip.label}</span>
          {tooltip.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#B4480A] text-white rounded-full leading-none">
              {tooltip.badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
