import React from 'react';
import { Link } from 'react-router-dom';
import { X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { useLayout } from '../../context/LayoutContext';
import { UserRole } from '../../types';
import { SidebarNavSection } from './SidebarNavSection';
import { SidebarUserMenu } from './SidebarUserMenu';

export const Sidebar: React.FC = () => {
  const { selectedCustomerId } = useCustomer();
  const { currentUser } = useAuth();
  const { getMenusByRole } = useMenu();
  const {
    isMobileSidebarOpen,
    closeMobileSidebar,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useLayout();

  const userRole: UserRole = currentUser?.role || 'sysadmin';
  const roleMenus = getMenusByRole(userRole);

  const cdpMenus = roleMenus.filter((m) => m.section === 'CDP');
  const activityMenus = roleMenus.filter((m) => m.section === 'ACTIVITY');
  const adminMenus = roleMenus.filter((m) => m.section === 'ADMINISTRATION');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-[264px] bg-sidebar-bg border-r border-sidebar-border h-screen flex flex-col justify-between select-none z-50 transition-[width,transform,padding] duration-200 ease-out lg:static lg:translate-x-0 lg:z-30 flex-shrink-0 ${
          isSidebarCollapsed
            ? 'lg:w-[68px] p-[14px_10px]'
            : 'lg:w-[238px] p-[16px_12px]'
        } ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Top Brand & Collapse Controls */}
          <div
            className={`relative flex items-center border-b border-sidebar-border/70 pb-3 ${
              isSidebarCollapsed ? 'lg:flex-col lg:gap-2 justify-between px-1' : 'justify-between px-1.5'
            }`}
          >
            <Link
              to="/"
              title="หน้าหลัก CusBox360"
              className="flex items-center justify-center group"
            >
              {isSidebarCollapsed ? (
                <>
                  <img
                    src="/logo-icon-transparent.png"
                    alt="CB360"
                    className="hidden lg:block w-8 h-8 object-contain drop-shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <img
                    src="/logo-full-transparent.png"
                    alt="CB360 - Customer Box 360°"
                    className="lg:hidden w-full max-w-[146px] h-auto object-contain"
                  />
                </>
              ) : (
                <img
                  src="/logo-full-transparent.png"
                  alt="CB360 - Customer Box 360°"
                  className="w-full max-w-[144px] h-auto object-contain drop-shadow-2xs group-hover:scale-[1.01] transition-transform duration-200"
                />
              )}
            </Link>

            {/* Desktop Collapse / Expand Rail Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title={isSidebarCollapsed ? 'กางแถบเมนูด้านซ้าย' : 'พับเก็บแถบเมนูด้านซ้าย (Icon Rail)'}
              aria-label={isSidebarCollapsed ? 'กางแถบเมนูด้านซ้าย' : 'พับเก็บแถบเมนูด้านซ้าย'}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-sidebar-label hover:text-brand hover:bg-white/80 transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Drawer Button */}
            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="ปิดเมนูการนำทาง"
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Sections */}
          <div className="flex flex-col gap-4">
            <SidebarNavSection
              title="CDP"
              items={cdpMenus}
              selectedCustomerId={selectedCustomerId}
              isCollapsed={isSidebarCollapsed}
            />
            <SidebarNavSection
              title="ACTIVITY"
              items={activityMenus}
              selectedCustomerId={selectedCustomerId}
              isCollapsed={isSidebarCollapsed}
            />
          </div>
        </div>

        {/* Bottom Administration + User Switcher */}
        <div className="flex flex-col flex-shrink-0 pt-2 border-t border-sidebar-border/80">
          <SidebarNavSection
            title="ADMINISTRATION"
            items={adminMenus}
            selectedCustomerId={selectedCustomerId}
            isCollapsed={isSidebarCollapsed}
            compactText
          />
          <SidebarUserMenu isCollapsed={isSidebarCollapsed} />
        </div>
      </aside>
    </>
  );
};
