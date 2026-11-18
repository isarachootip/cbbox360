-- 002_custom_fields_and_rls.up.sql
-- Custom field metadata, index table, SLA/cases tables, legacy tenant_id backfill, and RLS policies.

CREATE TABLE IF NOT EXISTS field_definitions (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL
                    CHECK (entity_type IN ('contact', 'case', 'deal', 'appointment', 'policy', 'claim')),
  field_key         TEXT NOT NULL,
  label             TEXT NOT NULL,
  field_type        TEXT NOT NULL
                    CHECK (field_type IN (
                      'text', 'textarea', 'number', 'currency', 'date', 'datetime',
                      'boolean', 'select', 'multiselect', 'tags', 'phone', 'email', 'object_list'
                    )),
  options_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  sensitivity       TEXT NOT NULL DEFAULT 'normal'
                    CHECK (sensitivity IN ('normal', 'pii', 'pdpa_s26')),
  acl_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
  ui_json           JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_indexed        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  origin            TEXT NOT NULL DEFAULT 'template' CHECK (origin IN ('template', 'tenant')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, entity_type, field_key)
);
CREATE INDEX IF NOT EXISTS idx_field_defs_lookup ON field_definitions(tenant_id, entity_type, is_active);

CREATE TABLE IF NOT EXISTS custom_field_index (
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL,
  entity_id         TEXT NOT NULL,
  field_key         TEXT NOT NULL,
  value_text        TEXT,
  value_num         NUMERIC,
  value_date        DATE,
  PRIMARY KEY (tenant_id, entity_type, entity_id, field_key)
);
CREATE INDEX IF NOT EXISTS idx_cf_text_search ON custom_field_index(tenant_id, entity_type, field_key, value_text);
CREATE INDEX IF NOT EXISTS idx_cf_date_range  ON custom_field_index(tenant_id, entity_type, field_key, value_date);

CREATE TABLE IF NOT EXISTS sla_policies (
  id                     TEXT PRIMARY KEY,
  tenant_id              TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug                   TEXT NOT NULL,
  name                   TEXT NOT NULL,
  first_response_minutes INTEGER NOT NULL,
  resolution_minutes     INTEGER NOT NULL,
  tier_multipliers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  escalation_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin                 TEXT NOT NULL DEFAULT 'template' CHECK (origin IN ('template', 'tenant')),
  is_customized          BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS case_categories (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  name              TEXT NOT NULL,
  sla_policy_slug   TEXT,
  default_queue     TEXT,
  required_fields   JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order        INTEGER NOT NULL DEFAULT 1,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  origin            TEXT NOT NULL DEFAULT 'template' CHECK (origin IN ('template', 'tenant')),
  is_customized     BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS cases (
  id                 TEXT NOT NULL,
  tenant_id          TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id         TEXT NOT NULL,
  title              TEXT NOT NULL,
  category_slug      TEXT NOT NULL,
  channel            TEXT NOT NULL DEFAULT 'LINE',
  status             TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Pending', 'Waiting', 'Closed')),
  priority           TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assignee_id        TEXT,
  queue_name         TEXT,
  sla_due_at         TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ,
  custom_fields      JSONB NOT NULL DEFAULT '{}'::jsonb,
  activity_logs      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON cases(tenant_id, status, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_cases_cf_gin ON cases USING GIN (custom_fields jsonb_path_ops);

-- Backfill tenant_id & custom_fields onto existing tables safely
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS canned_responses ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS canned_responses ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'template';
ALTER TABLE IF EXISTS canned_responses ADD COLUMN IF NOT EXISTS is_customized BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS consent_dsr_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS consent_policies ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS customer_industry_profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE IF EXISTS customer_industry_profiles DROP CONSTRAINT IF EXISTS customer_industry_profiles_kind_check;

-- Enable Row-Level Security on core tenant-scoped tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_cases ON cases;
CREATE POLICY tenant_isolation_cases ON cases
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));

ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_field_defs ON field_definitions;
CREATE POLICY tenant_isolation_field_defs ON field_definitions
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
