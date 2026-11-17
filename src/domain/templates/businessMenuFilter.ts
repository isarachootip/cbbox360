import {
  BusinessTemplateId,
  BusinessTemplatePreset,
  MenuItemConfig,
  UserRole,
} from '../../types';

export interface ScopedMenuOverride {
  enabled: string[];
  disabled: string[];
}

export type BusinessMenuOverrides = Partial<Record<BusinessTemplateId, ScopedMenuOverride>>;

interface FilterMenusParams {
  menus: MenuItemConfig[];
  role?: UserRole;
  activeBusiness: BusinessTemplateId;
  presets: BusinessTemplatePreset[];
  overrides?: BusinessMenuOverrides;
}

/**
 * Filters operational (`CDP` / `ACTIVITY`) system menus according to the active business's
 * recommendedMenus plus any per-business Admin overrides, while keeping `ADMINISTRATION`
 * and custom menus governed purely by role permissions.
 */
export const filterMenusForBusiness = ({
  menus,
  role,
  activeBusiness,
  presets,
  overrides = {},
}: FilterMenusParams): MenuItemConfig[] => {
  const preset = presets.find((p) => p.id === activeBusiness);
  const recommended = new Set(preset?.recommendedMenus ?? []);
  const businessOverride = overrides[activeBusiness];
  const forceEnabled = new Set(businessOverride?.enabled ?? []);
  const forceDisabled = new Set(businessOverride?.disabled ?? []);

  return menus
    .filter((menu) => {
      if (role && !menu.allowedRoles.includes(role)) return false;
      if (menu.section === 'ADMINISTRATION' || !menu.isSystem) return true;
      if (forceEnabled.has(menu.id)) return true;
      if (forceDisabled.has(menu.id)) return false;
      return preset ? recommended.has(menu.id) : true;
    })
    .sort((a, b) => a.order - b.order);
};

export const toggleBusinessMenuOverride = (
  overrides: BusinessMenuOverrides,
  activeBusiness: BusinessTemplateId,
  menuId: string,
  shouldShow: boolean
): BusinessMenuOverrides => {
  const current = overrides[activeBusiness] ?? { enabled: [], disabled: [] };
  const enabled = new Set(current.enabled);
  const disabled = new Set(current.disabled);

  if (shouldShow) {
    enabled.add(menuId);
    disabled.delete(menuId);
  } else {
    disabled.add(menuId);
    enabled.delete(menuId);
  }

  return {
    ...overrides,
    [activeBusiness]: {
      enabled: Array.from(enabled),
      disabled: Array.from(disabled),
    },
  };
};
