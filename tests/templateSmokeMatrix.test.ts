import { describe, it, expect } from 'vitest';
import { runTemplateSmokeFlow } from '../scripts/smoke-template.js';
import { bootstrapOnPremContract } from '../core/server/template-engine/onPremBootstrap.js';
import { createInMemoryTenantRepository } from '../core/server/tenancy/tenantRepository.js';
import { createInMemoryEntitlementService } from '../core/server/entitlements/entitlementService.js';
import { createInMemoryPermissionService } from '../core/server/rbac/permissionService.js';
import { createInMemoryLabelService } from '../core/server/labels/labelService.js';
import { createInMemoryCustomFieldService } from '../core/server/custom-fields/customFieldService.js';
import { createInMemoryCaseConfigService } from '../core/server/cases/caseConfigService.js';
import { createTemplateEngine } from '../core/server/template-engine/templateApplier.js';

describe('Phase 5 Multi-Template Smoke Matrix & On-Prem Preload', () => {
  it.each([
    {
      template: 'hospital',
      expectedContactLabel: 'ผู้ป่วย',
      sampleFields: {
        hn: 'HN-77001',
        drug_allergies: ['Penicillin'],
        treatment_right: 'PRIVATE_INSURANCE',
        preferred_department: 'อายุรกรรม',
        preferred_doctor: 'นพ. กิตติพงศ์',
      },
      entitledPath: '/api/m/appointment/appointments',
      entitledPayload: {
        contactId: 'SMOKE-1',
        hn: 'HN-77001',
        department: 'อายุรกรรม',
        doctorName: 'นพ. กิตติพงศ์',
        scheduledAt: '2026-12-10T09:00:00Z',
      },
      blockedPath: '/api/m/claim/claims',
    },
    {
      template: 'insurance',
      expectedContactLabel: 'ผู้เอาประกัน',
      sampleFields: {
        policy_number: 'POL-SMOKE-01',
        policy_type: 'HEALTH_OPD_IPD',
        policy_expiry_date: '2027-08-31',
        assigned_agent: 'วรัญญา',
      },
      entitledPath: '/api/m/policy/policies',
      entitledPayload: {
        contactId: 'SMOKE-1',
        policyNumber: 'POL-SMOKE-01',
        policyType: 'HEALTH_OPD_IPD',
        expiryDate: '2027-08-31',
        sumInsured: 1000000,
      },
      blockedPath: '/api/m/appointment/appointments',
    },
    {
      template: 'b2b_wholesale',
      expectedContactLabel: 'ลูกค้า',
      sampleFields: { credit_term_days: 30 },
      entitledPath: '/api/m/credit-sales/accounts',
      entitledPayload: { contactId: 'SMOKE-1', creditLimit: 500000, creditUsed: 50000 },
      blockedPath: '/api/m/appointment/appointments',
    },
    {
      template: 'ecommerce',
      expectedContactLabel: 'ผู้ซื้อ',
      sampleFields: { marketplace_member_id: 'SHOPEE-991' },
      entitledPath: '/api/m/order-tracking/orders',
      entitledPayload: {
        contactId: 'SMOKE-1',
        orderCode: 'ORD-SMOKE-1',
        trackingNumber: 'KEX-12345',
        totalAmount: 1990,
      },
      blockedPath: '/api/m/claim/claims',
    },
  ])(
    'provisions a tenant from "$template" template and passes full HTTP flow & entitlement isolation',
    async (scenario) => {
      const summary = await runTemplateSmokeFlow(scenario.template, {
        sampleFields: scenario.sampleFields,
        entitledPath: scenario.entitledPath,
        entitledPayload: scenario.entitledPayload,
        blockedPath: scenario.blockedPath,
      });

      expect(summary.ok).toBe(true);
      expect(summary.contactLabel).toBe(scenario.expectedContactLabel);
      expect(summary.entitledStatus).toBe(201);
      expect(summary.blockedStatus).toBe(403);
    }
  );

  it('preloads contracted template and licensed module overrides idempotently in on-prem mode', async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const entitlements = createInMemoryEntitlementService();
    const permissions = createInMemoryPermissionService();
    const labels = createInMemoryLabelService();
    const customFields = createInMemoryCustomFieldService();
    const caseConfigs = createInMemoryCaseConfigService();
    const engine = createTemplateEngine({
      tenantRepo,
      entitlements,
      permissions,
      labels,
      customFields,
      caseConfigs,
    });

    const firstBoot = await bootstrapOnPremContract({
      envConfig: {
        preloadTemplate: 'hospital',
        tenantSlug: 'onprem-hosp',
        tenantName: 'รพ. ติดตั้ง On-Prem',
        licensedEntitlements: 'module:appointment,connector:his-fhir',
        disabledEntitlements: 'flag:ai_copilot',
      },
      engine,
      tenantRepo,
      entitlements,
    });

    expect(firstBoot.provisioned).toBe(true);
    expect(await entitlements.isEnabled(firstBoot.tenantId, 'module:appointment')).toBe(true);
    expect(await entitlements.isEnabled(firstBoot.tenantId, 'flag:ai_copilot')).toBe(false);

    // Second container restart must be idempotent and preserve custom labels
    await labels.setTenantLabel(firstBoot.tenantId, 'th', 'contact.singular', 'ผู้ป่วยใน');
    const secondBoot = await bootstrapOnPremContract({
      envConfig: {
        preloadTemplate: 'hospital',
        tenantSlug: 'onprem-hosp',
        tenantName: 'รพ. ติดตั้ง On-Prem',
      },
      engine,
      tenantRepo,
      entitlements,
    });
    expect(secondBoot.provisioned).toBe(true);
    expect(await labels.t(firstBoot.tenantId, 'contact.singular', 'ลูกค้า')).toBe('ผู้ป่วยใน');
  });
});
