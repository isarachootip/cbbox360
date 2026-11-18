-- 001_tenant_control_plane.up.sql
-- Multi-tenant control plane, runtime settings, entitlements, RBAC, labels, and encrypted connectors.

CREATE TABLE IF NOT EXISTS tenants (
  id                TEXT PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'provisioning')),
  template_id       TEXT,
  template_version  TEXT,
  isolation_mode    TEXT NOT NULL DEFAULT 'shared_db'
                    CHECK (isolation_mode IN ('shared_db', 'dedicated_db')),
  db_dsn_encrypted  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_domains (
  hostname          TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id         TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding          JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_hours    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ivr_scripts       JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflows         JSONB NOT NULL DEFAULT '[]'::jsonb,
  general_config    JSONB NOT NULL DEFAULT '{}'::jsonb,
  customized_paths  TEXT[] NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_entitlements (
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key       TEXT NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  limits_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin            TEXT NOT NULL DEFAULT 'template'
                    CHECK (origin IN ('template', 'license', 'tenant_admin')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_key)
);

CREATE TABLE IF NOT EXISTS tenant_labels (
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locale            TEXT NOT NULL DEFAULT 'th',
  label_key         TEXT NOT NULL,
  label_value       TEXT NOT NULL,
  origin            TEXT NOT NULL DEFAULT 'template'
                    CHECK (origin IN ('template', 'tenant')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, locale, label_key)
);

CREATE TABLE IF NOT EXISTS tenant_roles (
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_key          TEXT NOT NULL,
  name              TEXT NOT NULL,
  permissions       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system         BOOLEAN NOT NULL DEFAULT FALSE,
  origin            TEXT NOT NULL DEFAULT 'template'
                    CHECK (origin IN ('template', 'tenant')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (tenant_id, role_key)
);

CREATE TABLE IF NOT EXISTS tenant_connectors (
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  connector_id      TEXT NOT NULL,
  connector_type    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'disconnected',
  public_config     JSONB NOT NULL DEFAULT '{}'::jsonb,
  secrets_encrypted TEXT,
  webhook_route_key TEXT UNIQUE,
  origin            TEXT NOT NULL DEFAULT 'template'
                    CHECK (origin IN ('template', 'tenant')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, connector_id)
);

-- Seed backward-compatible 'default' tenant so existing installations run without disruption
INSERT INTO tenants (id, slug, name, status, template_id, template_version)
VALUES ('default', 'default', 'CusBox360 Default Workspace', 'active', 'b2b_wholesale', '1.0.0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_settings (tenant_id, branding)
VALUES (
  'default',
  '{"appName":"CusBox360","logoUrl":"/logo-full-transparent.png","iconUrl":"/logo-icon-transparent.png","primaryColor":"#1F6FD1","accentColor":"#1558B0"}'::jsonb
)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO tenant_entitlements (tenant_id, feature_key, enabled, origin)
VALUES
  ('default', 'module:credit-sales', TRUE, 'template'),
  ('default', 'flag:ai_copilot', TRUE, 'template'),
  ('default', 'flag:voice_3cx', TRUE, 'template'),
  ('default', 'flag:pdpa_consent', TRUE, 'template')
ON CONFLICT (tenant_id, feature_key) DO NOTHING;
