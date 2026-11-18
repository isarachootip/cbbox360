import { describe, it, expect, vi } from 'vitest';
import { createInMemoryTenantRepository } from '../tenantRepository.js';
import { createInMemoryConnectorVault } from '../connectorVaultRepository.js';
import { createTenantResolverMiddleware } from '../tenantResolverMiddleware.js';
import { getCurrentTenantId } from '../tenantContext.js';

describe('Tenant Resolver Middleware & Encrypted Connector Vault (Phase 2 - PR-02)', () => {
  const setup = async () => {
    const tenantRepo = createInMemoryTenantRepository();
    const connectorVault = createInMemoryConnectorVault();

    await tenantRepo.upsertTenant({
      id: 'tnt_rama',
      slug: 'rama',
      name: 'โรงพยาบาลรามาเมดิคอล',
      status: 'active',
      templateId: 'hospital',
    });
    await tenantRepo.bindDomain('crm.ramamed.co.th', 'tnt_rama', true);

    await tenantRepo.upsertTenant({
      id: 'tnt_viriyah',
      slug: 'viriyah',
      name: 'วิริยะประกันภัย สาขาตัวอย่าง',
      status: 'active',
      templateId: 'insurance',
    });

    await tenantRepo.upsertTenant({
      id: 'tnt_suspended',
      slug: 'oldcorp',
      name: 'Suspended Corp',
      status: 'suspended',
    });

    await connectorVault.upsertConnector({
      tenantId: 'tnt_rama',
      connectorId: 'line',
      connectorType: 'channel',
      status: 'connected',
      publicConfig: { accountName: 'Rama Official OA' },
      secrets: { accessToken: 'rama_secret_access_token', appSecret: 'rama_hmac_secret' },
      webhookRouteKey: 'line_ch_998877',
      origin: 'tenant',
      isCustomized: true,
    });

    const middleware = createTenantResolverMiddleware({
      tenantRepo,
      connectorVault,
      baseDomains: ['cb360.online', 'localhost'],
    });

    return { tenantRepo, connectorVault, middleware };
  };

  it('resolves custom domain to the mapped tenant and binds AsyncLocalStorage', async () => {
    const { middleware } = await setup();
    let observedTenant = null;
    const req = { headers: { host: 'crm.ramamed.co.th' }, path: '/api/customers', params: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await middleware(req, res, () => {
      observedTenant = getCurrentTenantId();
    });

    expect(observedTenant).toBe('tnt_rama');
    expect(req.tenant.slug).toBe('rama');
  });

  it('resolves tenant subdomain (<slug>.cb360.online) while keeping bare base domain on default', async () => {
    const { middleware } = await setup();
    let subObserved = null;
    let rootObserved = null;

    await middleware(
      { headers: { host: 'viriyah.cb360.online' }, path: '/api/customers', params: {} },
      { status: vi.fn().mockReturnThis(), json: vi.fn() },
      () => {
        subObserved = getCurrentTenantId();
      }
    );

    await middleware(
      { headers: { host: 'cb360.online' }, path: '/api/customers', params: {} },
      { status: vi.fn().mockReturnThis(), json: vi.fn() },
      () => {
        rootObserved = getCurrentTenantId();
      }
    );

    expect(subObserved).toBe('tnt_viriyah');
    expect(rootObserved).toBe('default');
  });

  it('resolves incoming webhook channelId to its owning tenant via connector vault route key', async () => {
    const { middleware } = await setup();
    let webhookTenant = null;
    const req = {
      headers: { host: 'cb360.online' },
      path: '/api/webhooks/line/line_ch_998877',
      params: { channelId: 'line_ch_998877' },
    };

    await middleware(req, { status: vi.fn().mockReturnThis(), json: vi.fn() }, () => {
      webhookTenant = getCurrentTenantId();
    });

    expect(webhookTenant).toBe('tnt_rama');
  });

  it('blocks requests targeting a suspended tenant with 403 TENANT_SUSPENDED', async () => {
    const { middleware } = await setup();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await middleware(
      { headers: { 'x-tenant-slug': 'oldcorp', host: 'localhost:3000' }, path: '/api/customers', params: {} },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TENANT_SUSPENDED' }));
  });

  it('encrypts connector secrets with AES-256-GCM at rest and omits secrets from public listings', async () => {
    const { connectorVault } = await setup();

    const rawRow = connectorVault._inspectRawRow('tnt_rama', 'line');
    expect(rawRow.secrets_encrypted).toBeTruthy();
    expect(rawRow.secrets_encrypted).not.toContain('rama_secret_access_token');

    const publicList = await connectorVault.listPublicConnectors('tnt_rama');
    expect(publicList).toHaveLength(1);
    expect(publicList[0].hasSecrets).toBe(true);
    expect(publicList[0].secrets).toBeUndefined();

    const full = await connectorVault.getConnectorWithSecrets('tnt_rama', 'line');
    expect(full?.secrets.accessToken).toBe('rama_secret_access_token');
    expect(full?.secrets.appSecret).toBe('rama_hmac_secret');
  });

  it('tracks customized_paths on tenant_settings so template re-imports preserve tenant edits', async () => {
    const { tenantRepo } = await setup();

    await tenantRepo.updateTenantSettings(
      'tnt_rama',
      { branding: { appName: 'Rama Care 360', primaryColor: '#0D9488' } },
      { markCustomized: true }
    );

    // Subsequent template-origin update must NOT overwrite customized 'branding'
    await tenantRepo.applyTemplateSettingsDefaults('tnt_rama', {
      branding: { appName: 'Generic Hospital', primaryColor: '#059669' },
      businessHours: { start: '08:00', end: '20:00' },
    });

    const settings = await tenantRepo.getTenantSettings('tnt_rama');
    expect(settings.branding.appName).toBe('Rama Care 360');
    expect(settings.businessHours.start).toBe('08:00');
    expect(settings.customizedPaths).toContain('branding');
  });
});
