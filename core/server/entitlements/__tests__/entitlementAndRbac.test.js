import { describe, it, expect, vi } from 'vitest';
import { createInMemoryEntitlementService } from '../entitlementService.js';
import { createInMemoryPermissionService } from '../../rbac/permissionService.js';
import { runWithTenantContext } from '../../tenancy/tenantContext.js';

describe('Entitlement Service & Permission RBAC (Phase 2 - PR-03)', () => {
  it('enforces feature flags per tenant via requireEntitlement middleware', async () => {
    const entitlements = createInMemoryEntitlementService();
    await entitlements.setEntitlement('tnt_hosp', 'module:appointment', true, {
      origin: 'template',
      isCustomized: false,
    });

    const guard = entitlements.requireEntitlement('module:appointment');

    // Allowed on tnt_hosp
    const nextAllowed = vi.fn();
    await runWithTenantContext({ tenantId: 'tnt_hosp' }, () =>
      guard({}, { status: vi.fn().mockReturnThis(), json: vi.fn() }, nextAllowed)
    );
    expect(nextAllowed).toHaveBeenCalledTimes(1);

    // Blocked on default tenant (not entitled to module:appointment)
    const resBlocked = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const nextBlocked = vi.fn();
    await runWithTenantContext({ tenantId: 'default' }, () =>
      guard({}, resBlocked, nextBlocked)
    );
    expect(nextBlocked).not.toHaveBeenCalled();
    expect(resBlocked.status).toHaveBeenCalledWith(403);
    expect(resBlocked.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FEATURE_NOT_ENTITLED', featureKey: 'module:appointment' })
    );
  });

  it('protects tenant-customized entitlements from being overwritten during template updates', async () => {
    const entitlements = createInMemoryEntitlementService();

    // Seed from template
    await entitlements.applyTemplateEntitlements('tnt_hosp', {
      'module:appointment': true,
      'flag:ai_copilot': true,
    });

    // Tenant admin explicitly disables AI copilot
    await entitlements.setEntitlement('tnt_hosp', 'flag:ai_copilot', false, {
      origin: 'tenant_admin',
      isCustomized: true,
    });

    // Re-applying template version 1.1.0 must NOT re-enable flag:ai_copilot, while adding new flags
    await entitlements.applyTemplateEntitlements('tnt_hosp', {
      'module:appointment': true,
      'flag:ai_copilot': true,
      'connector:his-fhir': true,
    });

    const map = await entitlements.getEntitlementMap('tnt_hosp');
    expect(map['flag:ai_copilot']).toBe(false);
    expect(map['connector:his-fhir']).toBe(true);
    expect(map['module:appointment']).toBe(true);
  });

  it('supports template-defined custom roles (e.g. claim_adjuster) and enforces requirePermission', async () => {
    const rbac = createInMemoryPermissionService();

    await rbac.upsertRole('tnt_ins', {
      roleKey: 'claim_adjuster',
      name: 'เจ้าหน้าที่สินไหมทดแทน',
      permissions: ['contact:read', 'case:read', 'claim:approve'],
      origin: 'template',
    });

    expect(await rbac.hasPermission('tnt_ins', 'claim_adjuster', 'claim:approve')).toBe(true);
    expect(await rbac.hasPermission('tnt_ins', 'claim_adjuster', 'admin:users')).toBe(false);
    expect(await rbac.hasPermission('tnt_ins', 'sysadmin', 'admin:users')).toBe(true);

    const guard = rbac.requirePermission('claim:approve');

    const nextOk = vi.fn();
    await runWithTenantContext({ tenantId: 'tnt_ins' }, () =>
      guard(
        { user: { id: 'u1', role: 'claim_adjuster' } },
        { status: vi.fn().mockReturnThis(), json: vi.fn() },
        nextOk
      )
    );
    expect(nextOk).toHaveBeenCalledTimes(1);

    const resDenied = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const nextDenied = vi.fn();
    await runWithTenantContext({ tenantId: 'tnt_ins' }, () =>
      guard({ user: { id: 'u2', role: 'SF_1' } }, resDenied, nextDenied)
    );
    expect(nextDenied).not.toHaveBeenCalled();
    expect(resDenied.status).toHaveBeenCalledWith(403);
    expect(resDenied.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'INSUFFICIENT_PERMISSION' })
    );
  });
});
