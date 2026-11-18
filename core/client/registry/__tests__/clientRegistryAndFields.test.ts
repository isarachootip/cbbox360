import { describe, it, expect } from 'vitest';
import { clientModuleRegistry } from '../clientModuleRegistry';
import { buildDynamicZodSchema } from '../../../shared/dynamicFieldSchema.js';
import type { TenantFieldDefinition } from '../../providers/TenantRuntimeContext';

const DummyCard = () => null;
const DummyTab = () => null;

describe('Client Module Registry & Dynamic Zod Schema (Phase 2 Frontend)', () => {
  it('filters UI slots and contact tabs strictly by tenant entitlement and user permissions', () => {
    clientModuleRegistry.register({
      id: 'test-policy-ui',
      requiredEntitlement: 'module:policy',
      slots: {
        'contact.right_rail.cards': DummyCard,
      },
      contactTabs: [
        {
          key: 'policies',
          labelKey: 'tab.policies',
          defaultLabel: 'กรมธรรม์',
          requiredPermission: 'policy:read',
          component: DummyTab,
        },
      ],
    });

    // Not entitled -> zero slots, zero tabs
    expect(
      clientModuleRegistry.getSlotComponents('contact.right_rail.cards', () => false)
    ).toHaveLength(0);
    expect(
      clientModuleRegistry.getContactTabs(
        () => false,
        () => true
      )
    ).toHaveLength(0);

    // Entitled + permitted -> returns slot and tab
    const slots = clientModuleRegistry.getSlotComponents(
      'contact.right_rail.cards',
      (k) => k === 'module:policy'
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].moduleId).toBe('test-policy-ui');

    const tabsNoPerm = clientModuleRegistry.getContactTabs(
      (k) => k === 'module:policy',
      () => false
    );
    expect(tabsNoPerm).toHaveLength(0);

    const tabsWithPerm = clientModuleRegistry.getContactTabs(
      (k) => k === 'module:policy',
      (p) => p === 'policy:read'
    );
    expect(tabsWithPerm).toHaveLength(1);
    expect(tabsWithPerm[0].defaultLabel).toBe('กรมธรรม์');
  });

  it('validates numbers, dates, and select options through shared TypeScript contract', () => {
    const defs: TenantFieldDefinition[] = [
      {
        id: 'f1',
        entityType: 'contact',
        key: 'sum_insured',
        label: 'ทุนประกัน',
        type: 'currency',
        validation: { required: true, min: 10000 },
      },
      {
        id: 'f2',
        entityType: 'contact',
        key: 'plan_type',
        label: 'แผนประกัน',
        type: 'select',
        options: [
          { value: 'HEALTH', label: 'สุขภาพ' },
          { value: 'LIFE', label: 'ชีวิต' },
        ],
      },
    ];

    const schema = buildDynamicZodSchema(defs);
    expect(schema.safeParse({ sum_insured: 5000 }).success).toBe(false);
    expect(schema.safeParse({ sum_insured: 500000, plan_type: 'INVALID' }).success).toBe(false);
    expect(schema.safeParse({ sum_insured: 500000, plan_type: 'HEALTH' }).success).toBe(true);
  });
});
