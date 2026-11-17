import { describe, it, expect } from 'vitest';
import { initialMenuItems } from '../../data/menus';
import { businessTemplates } from '../../data/businessTemplates';
import {
  filterMenusForBusiness,
  toggleBusinessMenuOverride,
} from './businessMenuFilter';

describe('businessMenuFilter — dynamic Sidebar menus per business', () => {
  it('shows only recommended CDP/ACTIVITY menus for contact_center while keeping ADMINISTRATION', () => {
    const visible = filterMenusForBusiness({
      menus: initialMenuItems,
      role: 'sysadmin',
      activeBusiness: 'contact_center',
      presets: businessTemplates,
    });

    const ids = visible.map((m) => m.id);
    expect(ids).toContain('menu-customer360');
    expect(ids).toContain('menu-inbox');
    expect(ids).toContain('menu-cases');
    expect(ids).toContain('menu-voice');
    expect(ids).toContain('menu-settings'); // ADMINISTRATION stays accessible

    expect(ids).not.toContain('menu-credit'); // hidden for contact_center
    expect(ids).not.toContain('menu-pipeline'); // hidden for contact_center
  });

  it('shows Credit Sales and Sales Pipeline when switched to b2b_wholesale', () => {
    const visible = filterMenusForBusiness({
      menus: initialMenuItems,
      role: 'sysadmin',
      activeBusiness: 'b2b_wholesale',
      presets: businessTemplates,
    });
    const ids = visible.map((m) => m.id);
    expect(ids).toContain('menu-credit');
    expect(ids).toContain('menu-pipeline');
  });

  it('respects admin overrides per business without affecting other businesses', () => {
    const overrides = toggleBusinessMenuOverride({}, 'contact_center', 'menu-pipeline', true);

    const ccVisible = filterMenusForBusiness({
      menus: initialMenuItems,
      role: 'sysadmin',
      activeBusiness: 'contact_center',
      presets: businessTemplates,
      overrides,
    });
    expect(ccVisible.map((m) => m.id)).toContain('menu-pipeline');

    const hospVisible = filterMenusForBusiness({
      menus: initialMenuItems,
      role: 'sysadmin',
      activeBusiness: 'hospital',
      presets: businessTemplates,
      overrides,
    });
    expect(hospVisible.map((m) => m.id)).not.toContain('menu-pipeline');
  });
});
