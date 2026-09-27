import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItemConfig, UserRole, MenuSection } from '../types';
import { initialMenuItems } from '../data/menus';

interface MenuContextType {
  menus: MenuItemConfig[];
  createMenu: (menuData: Omit<MenuItemConfig, 'id' | 'isSystem'>) => { success: boolean; error?: string; menu?: MenuItemConfig };
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
  const [menus, setMenus] = useState<MenuItemConfig[]>(() => {
    try {
      const saved = localStorage.getItem(MENUS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge in any missing system menus if upgraded
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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
    } catch (e) {
      console.error('Failed to save menus to localStorage', e);
    }
  }, [menus]);

  // Create Menu
  const createMenu = (
    menuData: Omit<MenuItemConfig, 'id' | 'isSystem'>
  ): { success: boolean; error?: string; menu?: MenuItemConfig } => {
    if (!menuData.name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อเมนู' };
    }
    if (!menuData.path?.trim()) {
      return { success: false, error: 'กรุณาระบุ Route Path' };
    }

    const formattedPath = menuData.path.startsWith('/') ? menuData.path : `/${menuData.path}`;
    
    // Check duplicate path
    const existing = menus.find((m) => m.path.toLowerCase() === formattedPath.toLowerCase());
    if (existing) {
      return { success: false, error: `Route Path "${formattedPath}" มีอยู่ในระบบแล้ว` };
    }

    const newId = `menu-custom-${Date.now()}`;
    const newMenuItem: MenuItemConfig = {
      ...menuData,
      id: newId,
      path: formattedPath,
      activeMatch: formattedPath,
      isSystem: false,
      order: menuData.order || menus.length + 1,
      allowedRoles: menuData.allowedRoles?.length ? menuData.allowedRoles : ['sysadmin', 'admin'],
    };

    setMenus((prev) => [...prev, newMenuItem]);
    return { success: true, menu: newMenuItem };
  };

  // Update Menu
  const updateMenu = (id: string, partial: Partial<MenuItemConfig>): { success: boolean; error?: string } => {
    const target = menus.find((m) => m.id === id);
    if (!target) {
      return { success: false, error: 'ไม่พบเมนูที่ต้องการแก้ไข' };
    }

    setMenus((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            ...partial,
            path: partial.path ? (partial.path.startsWith('/') ? partial.path : `/${partial.path}`) : m.path,
          };
        }
        return m;
      })
    );
    return { success: true };
  };

  // Delete Menu
  const deleteMenu = (id: string): { success: boolean; error?: string } => {
    const target = menus.find((m) => m.id === id);
    if (!target) {
      return { success: false, error: 'ไม่พบเมนูที่ต้องการลบ' };
    }

    if (target.isSystem) {
      return { success: false, error: 'ไม่สามารถลบเมนูหลักของระบบได้ (แต่สามารถปิดสิทธิ์การเข้าถึงของทุก Role ได้)' };
    }

    setMenus((prev) => prev.filter((m) => m.id !== id));
    return { success: true };
  };

  // Toggle Role Access for a single menu item
  const toggleRoleAccess = (menuId: string, role: UserRole) => {
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id === menuId) {
          const hasRole = m.allowedRoles.includes(role);
          const updatedRoles = hasRole
            ? m.allowedRoles.filter((r) => r !== role)
            : [...m.allowedRoles, role];
          return { ...m, allowedRoles: updatedRoles };
        }
        return m;
      })
    );
  };

  // Set all menus for a specific role at once
  const setRoleAccessBulk = (role: UserRole, menuIds: string[]) => {
    const menuSet = new Set(menuIds);
    setMenus((prev) =>
      prev.map((m) => {
        const shouldHave = menuSet.has(m.id);
        const hasRole = m.allowedRoles.includes(role);
        if (shouldHave && !hasRole) {
          return { ...m, allowedRoles: [...m.allowedRoles, role] };
        }
        if (!shouldHave && hasRole) {
          return { ...m, allowedRoles: m.allowedRoles.filter((r) => r !== role) };
        }
        return m;
      })
    );
  };

  // Enable all menus for role
  const enableAllForRole = (role: UserRole) => {
    setMenus((prev) =>
      prev.map((m) => {
        if (!m.allowedRoles.includes(role)) {
          return { ...m, allowedRoles: [...m.allowedRoles, role] };
        }
        return m;
      })
    );
  };

  // Disable all menus for role
  const disableAllForRole = (role: UserRole) => {
    setMenus((prev) =>
      prev.map((m) => ({
        ...m,
        allowedRoles: m.allowedRoles.filter((r) => r !== role),
      }))
    );
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setMenus(initialMenuItems);
  };

  // Get menus for a specific role
  const getMenusByRole = (role?: UserRole): MenuItemConfig[] => {
    if (!role) return menus;
    return menus
      .filter((m) => m.allowedRoles.includes(role))
      .sort((a, b) => a.order - b.order);
  };

  // Check if role has access to a specific path
  const hasRoleAccess = (path: string, role?: UserRole): boolean => {
    if (!role) return false;
    if (role === 'sysadmin' || role === 'admin') return true;

    const matchedMenu = menus.find((m) => {
      if (m.path === path) return true;
      if (m.activeMatch && path.startsWith(m.activeMatch)) return true;
      return false;
    });

    if (!matchedMenu) return true; // allow unspecified paths
    return matchedMenu.allowedRoles.includes(role);
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
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
