-- 003_entity_custom_field_values.up.sql
-- Stores entity-level JSONB custom field payloads independently of legacy table rows.

CREATE TABLE IF NOT EXISTS entity_custom_fields (
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  values_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, entity_type, entity_id)
);

ALTER TABLE entity_custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_entity_cf ON entity_custom_fields;
CREATE POLICY tenant_isolation_entity_cf ON entity_custom_fields
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
