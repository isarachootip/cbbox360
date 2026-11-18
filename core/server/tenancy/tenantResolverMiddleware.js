/**
 * tenantResolverMiddleware.js — Resolves active Tenant per HTTP/Webhook request, enforces
 * Zero-Selection Subdomain Lock (ignoring header overrides on customer domains), and flags Control Plane hosts.
 */
import { runWithTenantContext, DEFAULT_TENANT_ID } from './tenantContext.js';
import { tenantRepository as defaultTenantRepo } from './tenantRepository.js';
import { connectorVaultRepository as defaultConnectorVault } from './connectorVaultRepository.js';

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

const extractWebhookChannelKey = (req) => {
  if (req.params?.channelId) return req.params.channelId;
  const match = String(req.path || '').match(/\/webhooks\/[^/]+\/([^/?#]+)/i);
  return match ? match[1] : null;
};

const normalizeCleanHost = (hostname) =>
  String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');

const isBareControlHost = (cleanHost, baseDomains) => {
  if (!cleanHost || cleanHost === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
    return true;
  }
  return baseDomains.some((b) => {
    const base = b.toLowerCase();
    return cleanHost === base || cleanHost === `www.${base}` || cleanHost === `console.${base}`;
  });
};

const extractSubdomainSlug = (cleanHost, baseDomains) => {
  if (!cleanHost || cleanHost === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) return null;

  for (const base of baseDomains) {
    const cleanBase = base.toLowerCase();
    if (cleanHost === cleanBase || cleanHost === `www.${cleanBase}` || cleanHost === `console.${cleanBase}`) {
      return null;
    }
    if (cleanHost.endsWith(`.${cleanBase}`)) {
      const sub = cleanHost.slice(0, -(cleanBase.length + 1));
      if (sub && !sub.includes('.') && sub !== 'api' && sub !== 'www') {
        return sub;
      }
    }
  }
  return null;
};

export const createTenantResolverMiddleware = ({
  tenantRepo = defaultTenantRepo,
  connectorVault = defaultConnectorVault,
  baseDomains = [...DEFAULT_BASE_DOMAINS, ...parseExtraDomains(process.env.CB360_BASE_DOMAINS)],
  deploymentMode = process.env.CB360_DEPLOYMENT_MODE || 'multi_tenant',
} = {}) => {
  return async (req, res, next) => {
    const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
    const cleanHost = normalizeCleanHost(rawHost);

    // Check if host is explicitly bound to a customer tenant domain first
    const domainBoundTenant = cleanHost ? await tenantRepo.findByDomain(cleanHost) : null;
    const isCustomerDomainBound = Boolean(domainBoundTenant && domainBoundTenant.id !== DEFAULT_TENANT_ID);

    const isControlPlaneHost =
      deploymentMode !== 'single_tenant' &&
      !isCustomerDomainBound &&
      isBareControlHost(cleanHost, baseDomains);

    let tenant = null;

    // Header overrides are ONLY honored on Control Plane hosts (never on customer subdomains!)
    if (isControlPlaneHost) {
      const headerTenantId = req.headers?.['x-tenant-id'];
      const headerTenantSlug = req.headers?.['x-tenant-slug'] || req.params?.tenantSlug;
      if (headerTenantId) tenant = await tenantRepo.findById(String(headerTenantId).trim());
      if (!tenant && headerTenantSlug) tenant = await tenantRepo.findBySlug(String(headerTenantSlug).trim());
    }

    if (!tenant) {
      const webhookKey = extractWebhookChannelKey(req);
      if (webhookKey) {
        const mappedTenantId = await connectorVault.findTenantIdByWebhookKey(webhookKey);
        if (mappedTenantId) tenant = await tenantRepo.findById(mappedTenantId);
      }
    }

    if (!tenant && domainBoundTenant) {
      tenant = domainBoundTenant;
    }

    if (!tenant && cleanHost) {
      const subSlug = extractSubdomainSlug(cleanHost, baseDomains);
      if (subSlug) tenant = await tenantRepo.findBySlug(subSlug);
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
    req.isControlPlaneHost = isControlPlaneHost;
    req.deploymentMode = deploymentMode;

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
