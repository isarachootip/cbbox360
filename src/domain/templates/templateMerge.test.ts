import { describe, it, expect } from 'vitest';
import {
  selectNewConnectors,
  selectNewCannedResponses,
  buildRulesToAdd,
  computeMenuGrants,
  applyMenuGrants,
  revertMenuGrants,
  removeTemplateConnectors,
  removeTemplateRules,
  mergeAddedResources,
  EMPTY_ADDED_RESOURCES,
} from './templateMerge';
import { businessTemplates } from '../../data/businessTemplates';
import { BotAutoReplyRule, ConnectorConfig, MenuItemConfig } from '../../types';

const hospital = businessTemplates.find((t) => t.id === 'hospital')!;

const userConnector: ConnectorConfig = {
  ...hospital.connectors[0],
  id: 'conn-line',
  name: 'LINE (user-edited token)',
  category: 'social',
  accessToken: 'USER-SECRET-TOKEN',
};

const userRule: BotAutoReplyRule = {
  id: 'rule-user-1',
  name: 'กฎที่ผู้ใช้สร้างเอง',
  triggerType: 'welcome',
  keywords: ['สวัสดี'],
  matchType: 'contains',
  isActive: true,
  priority: 1,
};

const menu = (id: string, roles: MenuItemConfig['allowedRoles']): MenuItemConfig => ({
  id,
  name: id,
  path: `/${id}`,
  icon: 'Users',
  section: 'CDP',
  order: 1,
  allowedRoles: roles,
});

describe('selectNewConnectors', () => {
  it('returns only template connectors not already present', () => {
    const firstOnly = [userConnector, hospital.connectors[0]];
    const result = selectNewConnectors(firstOnly, hospital);
    expect(result.map((c) => c.id)).toEqual([hospital.connectors[1].id]);
  });
});

describe('selectNewCannedResponses', () => {
  it('skips shortcuts that already exist (case-insensitive)', () => {
    const result = selectNewCannedResponses(['/APPOINT'], hospital);
    expect(result.map((c) => c.shortcut)).toEqual(['/insure', '/prep']);
  });
});

describe('buildRulesToAdd', () => {
  it('resolves canned response ids by shortcut and namespaces rule ids', () => {
    const shortcutToId = new Map([
      ['/appoint', 'cr-real-1'],
      ['/insure', 'cr-real-2'],
    ]);
    const rules = buildRulesToAdd([userRule], hospital, shortcutToId, 1000);
    expect(rules).toHaveLength(2);
    expect(rules[0].id).toBe('rule-hosp-appoint-1000-0');
    expect(rules[0].cannedResponseId).toBe('cr-real-1');
    expect(rules[0].priority).toBe(2);
  });

  it('does not duplicate rules that already exist by name', () => {
    const existing = [{ ...hospital.botRules[0], id: 'rule-hosp-appoint-1-0' }];
    const rules = buildRulesToAdd(existing, hospital, new Map(), 2000);
    expect(rules.map((r) => r.name)).toEqual([hospital.botRules[1].name]);
  });
});

describe('menu grants', () => {
  const menus = [menu('menu-inbox', ['admin']), menu('menu-cases', ['admin', 'SF_1'])];

  it('records only roles that were not already granted', () => {
    const grants = computeMenuGrants(menus, ['menu-inbox', 'menu-cases', 'missing'], ['admin', 'SF_1']);
    expect(grants).toEqual([{ menuId: 'menu-inbox', role: 'SF_1' }]);
  });

  it('revert removes exactly the granted roles and keeps pre-existing ones', () => {
    const grants = computeMenuGrants(menus, ['menu-inbox', 'menu-cases'], ['SF_1', 'SF_2']);
    const applied = applyMenuGrants(menus, grants);
    expect(applied[0].allowedRoles).toEqual(['admin', 'SF_1', 'SF_2']);
    const reverted = revertMenuGrants(applied, grants);
    expect(reverted.map((m) => m.allowedRoles)).toEqual([['admin'], ['admin', 'SF_1']]);
  });
});

describe('reset helpers', () => {
  it('removes template connectors but keeps user-edited connectors untouched', () => {
    const current = [userConnector, ...hospital.connectors];
    const result = removeTemplateConnectors(current, businessTemplates, []);
    expect(result).toEqual([userConnector]);
  });

  it('removes template-owned rules (including legacy Phase 1 ids) and keeps user rules', () => {
    const legacy = { ...hospital.botRules[0], id: 'rule-hosp-appoint-1729000000000-0' };
    const result = removeTemplateRules([userRule, legacy], businessTemplates, []);
    expect(result).toEqual([userRule]);
  });

  it('keeps user rule even if its id merely contains a template id', () => {
    const tricky = { ...userRule, id: 'my-rule-hosp-appoint' };
    expect(removeTemplateRules([tricky], businessTemplates, [])).toEqual([tricky]);
  });
});

describe('mergeAddedResources', () => {
  it('unions ids without duplicates', () => {
    const a = { ...EMPTY_ADDED_RESOURCES, connectorIds: ['x'], menuGrants: [{ menuId: 'm', role: 'SF_1' as const }] };
    const b = { ...EMPTY_ADDED_RESOURCES, connectorIds: ['x', 'y'], menuGrants: [{ menuId: 'm', role: 'SF_1' as const }] };
    const merged = mergeAddedResources(a, b);
    expect(merged.connectorIds).toEqual(['x', 'y']);
    expect(merged.menuGrants).toHaveLength(1);
  });
});
