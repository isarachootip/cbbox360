/**
 * tenantResolverMiddleware.js — Resolves active Tenant per HTTP/Webhook request and binds AsyncLocalStorage.
 * Resolution order:
 *   1. Explicit header (`x-tenant-id` / `x-tenant-slug`) or route param (`:tenantSlug`)
 *   2. Webhook channel route key (`/webhooks/line/:channelId` -> `tenant_connectors.webhook_route_key`)
 *   3. Exact custom domain in `tenant_domains`
 *   4. Subdomain `<slug>.<baseDomain>` (excluding bare baseDomain / www / localhost / IP)
 *   5. Safe fallback to `'default'` tenant for backward compatibility
 */
import { runWithTenantContext, DEFAULT_TENANT_ID } from './tenantContext.js';
import { tenantRepository as defaultTenantRepo } from './tenantRepository.js';
import { connectorVaultRepository as defaultConnectorVault } from './connectorVaultRepository.js';

const extractWebhookChannelKey = (req) => {
  if (req.params?.channelId) return req.params.channelId;
  const match = String(req.path || '').match(/\/webhooks\/[^/]+\/([^/?#]+)/i);
  return match ? match[1] : null;
};

const extractSubdomainSlug = (hostname, baseDomains) => {
  const host = String(hostname || '').trim().toLowerCase().replace(/:\d+$/, '');
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

  for (const base of baseDomains) {
    const cleanBase = base.toLowerCase();
    if (host === cleanBase || host === `www.${cleanBase}`) return null;
    if (host.endsWith(`.${cleanBase}`)) {
      const sub = host.slice(0, -(cleanBase.length + 1));
      if (sub && !sub.includes('.') && sub !== 'api' && sub !== 'www') {
        return sub;
      }
    }
  }
  return null;
};

const parseExtraDomains = (raw) =>
  String(raw || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

export const DEFAULT_BASE_DOMAINS = [
  'cbox360.online',
  'cb360.online',
  'cb360.co.th',
  'cusbox360.co.th',
  'localhost',
];

export const createTenantResolverMiddleware = ({
  tenantRepo = defaultTenantRepo,
  connectorVault = defaultConnectorVault,
  baseDomains = [...DEFAULT_BASE_DOMAINS, ...parseExtraDomains(process.env.CB360_BASE_DOMAINS)],
} = {}) => {
  return async (req, res, next) => {
    const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
    const headerTenantId = req.headers?.['x-tenant-id'];
    const headerTenantSlug = req.headers?.['x-tenant-slug'] || req.params?.tenantSlug;

    let tenant = null;

    if (headerTenantId) {
      tenant = await tenantRepo.findById(String(headerTenantId).trim());
    }
    if (!tenant && headerTenantSlug) {
      tenant = await tenantRepo.findBySlug(String(headerTenantSlug).trim());
    }

    if (!tenant) {
      const webhookKey = extractWebhookChannelKey(req);
      if (webhookKey) {
        const mappedTenantId = await connectorVault.findTenantIdByWebhookKey(webhookKey);
        if (mappedTenantId) {
          tenant = await tenantRepo.findById(mappedTenantId);
        }
      }
    }

    if (!tenant && rawHost) {
      tenant = await tenantRepo.findByDomain(rawHost);
    }

    if (!tenant && rawHost) {
      const subSlug = extractSubdomainSlug(rawHost, baseDomains);
      if (subSlug) {
        tenant = await tenantRepo.findBySlug(subSlug);
      }
    }

    if (!tenant) {
      tenant = (await tenantRepo.findById(DEFAULT_TENANT_ID)) || {
        id: DEFAULT_TENANT_ID,
        slug: DEFAULT_TENANT_ID,
        name: 'CusBox360 Default Workspace',
        status: 'active',
        isolationMode: 'shared_db',
      };
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'TENANT_SUSPENDED',
        message: 'บัญชีองค์กรนี้ถูกระงับการใช้งานชั่วคราว',
      });
    }

    req.tenant = tenant;
    return runWithTenantContext(
      {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        hostname: String(rawHost),
        isolationMode: tenant.isolationMode || 'shared_db',
      },
      () => next()
    );
  };
};
