import { MenuItemConfig, UserRole } from '../../types';

export const buildCustomMenuItem = (
  menus: MenuItemConfig[],
  menuData: Omit<MenuItemConfig, 'id' | 'isSystem'>
): { success: boolean; error?: string; menu?: MenuItemConfig } => {
  if (!menuData.name?.trim()) return { success: false, error: 'กรุณากรอกชื่อเมนู' };
  if (!menuData.path?.trim()) return { success: false, error: 'กรุณาระบุ Route Path' };

  const formattedPath = menuData.path.startsWith('/') ? menuData.path : `/${menuData.path}`;
  const existing = menus.find((m) => m.path.toLowerCase() === formattedPath.toLowerCase());
  if (existing) {
    return { success: false, error: `Route Path "${formattedPath}" มีอยู่ในระบบแล้ว` };
  }

  return {
    success: true,
    menu: {
      ...menuData,
      id: `menu-custom-${Date.now()}`,
      path: formattedPath,
      activeMatch: formattedPath,
      isSystem: false,
      order: menuData.order || menus.length + 1,
      allowedRoles: menuData.allowedRoles?.length ? menuData.allowedRoles : ['sysadmin', 'admin'],
    },
  };
};

export const toggleMenuRoleInList = (
  menus: MenuItemConfig[],
  menuId: string,
  role: UserRole
): MenuItemConfig[] =>
  menus.map((m) => {
    if (m.id !== menuId) return m;
    const hasRole = m.allowedRoles.includes(role);
    return {
      ...m,
      allowedRoles: hasRole ? m.allowedRoles.filter((r) => r !== role) : [...m.allowedRoles, role],
    };
  });

export const applyBulkRoleMenus = (
  menus: MenuItemConfig[],
  role: UserRole,
  menuIds: string[]
): MenuItemConfig[] => {
  const menuSet = new Set(menuIds);
  return menus.map((m) => {
    const shouldHave = menuSet.has(m.id);
    const hasRole = m.allowedRoles.includes(role);
    if (shouldHave && !hasRole) return { ...m, allowedRoles: [...m.allowedRoles, role] };
    if (!shouldHave && hasRole) return { ...m, allowedRoles: m.allowedRoles.filter((r) => r !== role) };
    return m;
  });
};
