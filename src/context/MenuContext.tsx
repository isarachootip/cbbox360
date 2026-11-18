import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItemConfig, UserRole } from '../types';
import { initialMenuItems } from '../data/menus';
import { businessTemplates } from '../data/businessTemplates';
import { filterMenusForBusiness } from '../domain/templates/businessMenuFilter';
import {
  applyBulkRoleMenus,
  buildCustomMenuItem,
  toggleMenuRoleInList,
} from '../domain/menus/menuOperations';
import { useBusinessTemplateState } from './BusinessTemplateContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

interface MenuContextType {
  menus: MenuItemConfig[];
  createMenu: (menuData: Omit<MenuItemConfig, 'id' | 'isSystem'>) => {
    success: boolean;
    error?: string;
    menu?: MenuItemConfig;
  };
  updateMenu: (id: string, partial: Partial<MenuItemConfig>) => { success: boolean; error?: string };
  deleteMenu: (id: string) => { success: boolean; error?: string };
  toggleRoleAccess: (menuId: string, role: UserRole) => void;
  setRoleAccessBulk: (role: UserRole, menuIds: string[]) => void;
  enableAllForRole: (role: UserRole) => void;
  disableAllForRole: (role: UserRole) => void;
  resetToDefaults: () => void;
  getMenusByRole: (role?: UserRole) => MenuItemConfig[];
  hasRoleAccess: (path: string, role?: UserRole) => boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);
const MENUS_STORAGE_KEY = 'cb360_menus_config';

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: templateState, setMenuOverride } = useBusinessTemplateState();
  const { isLoaded, isEntitled, templateId, isControlPlane } = useTenantRuntime();
  const [menus, setMenus] = useState<MenuItemConfig[]>(() => {
    try {
      const saved = localStorage.getItem(MENUS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: MenuItemConfig) => m.id));
          const missing = initialMenuItems.filter((m) => !existingIds.has(m.id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {
      console.error('Failed to load menus from localStorage', e);
    }
    return initialMenuItems;
  });

  useEffect(() => {
    try {
      localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
    } catch (e) {
      console.error('Failed to save menus to localStorage', e);
    }
  }, [menus]);

  const createMenu = (menuData: Omit<MenuItemConfig, 'id' | 'isSystem'>) => {
    const res = buildCustomMenuItem(menus, menuData);
    if (res.success && res.menu) setMenus((prev) => [...prev, res.menu!]);
    return res;
  };

  const updateMenu = (id: string, partial: Partial<MenuItemConfig>) => {
    if (!menus.some((m) => m.id === id)) return { success: false, error: 'ไม่พบเมนูที่ต้องการแก้ไข' };
    setMenus((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              ...partial,
              path: partial.path
                ? partial.path.startsWith('/')
                  ? partial.path
                  : `/${partial.path}`
                : m.path,
            }
          : m
      )
    );
    return { success: true };
  };

  const deleteMenu = (id: string) => {
    const target = menus.find((m) => m.id === id);
    if (!target) return { success: false, error: 'ไม่พบเมนูที่ต้องการลบ' };
    if (target.isSystem) {
      return {
        success: false,
        error: 'ไม่สามารถลบเมนูหลักของระบบได้ (แต่สามารถปิดสิทธิ์การเข้าถึงของทุก Role ได้)',
      };
    }
    setMenus((prev) => prev.filter((m) => m.id !== id));
    return { success: true };
  };

  const toggleRoleAccess = (menuId: string, role: UserRole) => {
    const target = menus.find((m) => m.id === menuId);
    if (target && target.section !== 'ADMINISTRATION' && !target.allowedRoles.includes(role)) {
      setMenuOverride(menuId, true);
    }
    setMenus((prev) => toggleMenuRoleInList(prev, menuId, role));
  };

  const setRoleAccessBulk = (role: UserRole, menuIds: string[]) =>
    setMenus((prev) => applyBulkRoleMenus(prev, role, menuIds));

  const enableAllForRole = (role: UserRole) =>
    setMenus((prev) =>
      prev.map((m) => (m.allowedRoles.includes(role) ? m : { ...m, allowedRoles: [...m.allowedRoles, role] }))
    );

  const disableAllForRole = (role: UserRole) =>
    setMenus((prev) => prev.map((m) => ({ ...m, allowedRoles: m.allowedRoles.filter((r) => r !== role) })));

  const resetToDefaults = () => setMenus(initialMenuItems);

  const getMenusByRole = (role?: UserRole): MenuItemConfig[] => {
    const matchedPreset = templateId
      ? businessTemplates.find((p) => p.id === templateId)?.id
      : undefined;
    const base = filterMenusForBusiness({
      menus,
      role,
      activeBusiness: matchedPreset || templateState.activeTemplateId,
      presets: businessTemplates,
      overrides: templateState.menuOverrides,
    });
    if (!isLoaded) return base.filter((m) => m.id !== 'menu-tenants');
    return base.filter((m) => {
      if (m.id === 'menu-tenants') return isControlPlane;
      if (m.id === 'menu-credit') return isEntitled('module:credit-sales');
      return true;
    });
  };

  const hasRoleAccess = (path: string, role?: UserRole): boolean => {
    if (!role) return false;
    if (role === 'sysadmin' || role === 'admin') return true;
    const matchedMenu = menus.find(
      (m) => m.path === path || Boolean(m.activeMatch && path.startsWith(m.activeMatch))
    );
    return matchedMenu ? matchedMenu.allowedRoles.includes(role) : true;
  };

  return (
    <MenuContext.Provider
      value={{
        menus,
        createMenu,
        updateMenu,
        deleteMenu,
        toggleRoleAccess,
        setRoleAccessBulk,
        enableAllForRole,
        disableAllForRole,
        resetToDefaults,
        getMenusByRole,
        hasRoleAccess,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within a MenuProvider');
  return context;
};
