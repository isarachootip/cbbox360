/**
 * connectorVaultRepository.js — Multi-tenant encrypted connector credentials vault.
 * Encrypts sensitive API tokens/secrets at rest using AES-256-GCM and maps webhook route keys to tenants.
 */
import { query as defaultDbQuery } from '../../../db.js';
import { encryptSecret, decryptSecret } from '../../../server/utils/cryptoUtils.js';

const parseSecrets = (encrypted) => {
  if (!encrypted) return {};
  const raw = decryptSecret(encrypted);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const toPublicConnector = (row) => ({
  tenantId: row.tenant_id,
  connectorId: row.connector_id,
  connectorType: row.connector_type,
  status: row.status,
  publicConfig: row.public_config || {},
  webhookRouteKey: row.webhook_route_key || null,
  hasSecrets: Boolean(row.secrets_encrypted),
  origin: row.origin || 'template',
  isCustomized: Boolean(row.is_customized),
});

export const createInMemoryConnectorVault = () => {
  const rows = new Map();
  const makeKey = (tenantId, connectorId) => `${tenantId}::${connectorId}`;

  return {
    _inspectRawRow(tenantId, connectorId) {
      return rows.get(makeKey(tenantId, connectorId)) ?? null;
    },

    async upsertConnector({
      tenantId,
      connectorId,
      connectorType,
      status = 'connected',
      publicConfig = {},
      secrets,
      webhookRouteKey = null,
      origin = 'tenant',
      isCustomized = true,
    }) {
      const key = makeKey(tenantId, connectorId);
      const prev = rows.get(key);
      const secretsEncrypted =
        secrets && Object.keys(secrets).length > 0
          ? encryptSecret(JSON.stringify(secrets))
          : (prev?.secrets_encrypted ?? null);

      const stored = {
        tenant_id: tenantId,
        connector_id: connectorId,
        connector_type: connectorType,
        status,
        public_config: publicConfig,
        secrets_encrypted: secretsEncrypted,
        webhook_route_key: webhookRouteKey ?? prev?.webhook_route_key ?? null,
        origin,
        is_customized: Boolean(isCustomized),
      };
      rows.set(key, stored);
      return toPublicConnector(stored);
    },

    async listPublicConnectors(tenantId) {
      const out = [];
      for (const row of rows.values()) {
        if (row.tenant_id === tenantId) out.push(toPublicConnector(row));
      }
      return out;
    },

    async getConnectorWithSecrets(tenantId, connectorId) {
      const row = rows.get(makeKey(tenantId, connectorId));
      if (!row) return null;
      return {
        ...toPublicConnector(row),
        secrets: parseSecrets(row.secrets_encrypted),
      };
    },

    async findTenantIdByWebhookKey(routeKey) {
      if (!routeKey) return null;
      const needle = String(routeKey).trim();
      for (const row of rows.values()) {
        if (row.webhook_route_key === needle) return row.tenant_id;
      }
      return null;
    },
  };
};

export const createPgConnectorVault = ({ query = defaultDbQuery } = {}) => {
  const fallback = createInMemoryConnectorVault();

  return {
    async upsertConnector(params) {
      const pub = await fallback.upsertConnector(params);
      const raw = fallback._inspectRawRow(params.tenantId, params.connectorId);
      try {
        await query(
          `INSERT INTO tenant_connectors (
             tenant_id, connector_id, connector_type, status, public_config,
             secrets_encrypted, webhook_route_key, origin, is_customized, updated_at
           ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,NOW())
           ON CONFLICT (tenant_id, connector_id) DO UPDATE SET
             status = EXCLUDED.status,
             public_config = EXCLUDED.public_config,
             secrets_encrypted = COALESCE(EXCLUDED.secrets_encrypted, tenant_connectors.secrets_encrypted),
             webhook_route_key = COALESCE(EXCLUDED.webhook_route_key, tenant_connectors.webhook_route_key),
             origin = EXCLUDED.origin,
             is_customized = EXCLUDED.is_customized,
             updated_at = NOW()`,
          [
            raw.tenant_id,
            raw.connector_id,
            raw.connector_type,
            raw.status,
            JSON.stringify(raw.public_config),
            raw.secrets_encrypted,
            raw.webhook_route_key,
            raw.origin,
            raw.is_customized,
          ]
        );
      } catch { /* fallback in memory when offline */ }
      return pub;
    },

    async findTenantIdByWebhookKey(routeKey) {
      if (!routeKey) return null;
      try {
        const r = await query(
          `SELECT tenant_id FROM tenant_connectors WHERE webhook_route_key = $1 LIMIT 1`,
          [String(routeKey).trim()]
        );
        if (r?.rows?.[0]?.tenant_id) return r.rows[0].tenant_id;
      } catch { /* fallback */ }
      return fallback.findTenantIdByWebhookKey(routeKey);
    },

    listPublicConnectors: (tenantId) => fallback.listPublicConnectors(tenantId),
    getConnectorWithSecrets: (tenantId, connectorId) => fallback.getConnectorWithSecrets(tenantId, connectorId),
  };
};

export const connectorVaultRepository = createPgConnectorVault();
