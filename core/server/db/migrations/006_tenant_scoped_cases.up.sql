-- 006_tenant_scoped_cases.up.sql
-- Creates tenant-isolated service_cases table with composite primary key, RLS policy,
-- and future-proof external ticketing reference columns for third-party helpdesk linking.

CREATE TABLE IF NOT EXISTS service_cases (
  id                 TEXT NOT NULL,
  tenant_id          TEXT NOT NULL DEFAULT 'default',
  customer_id        TEXT NOT NULL,
  customer_name      TEXT NOT NULL,
  customer_tier      TEXT NOT NULL DEFAULT 'MEMBER',
  title              TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL DEFAULT 'Inquiry',
  system_name        TEXT NOT NULL DEFAULT '',
  priority           TEXT NOT NULL DEFAULT 'Normal',
  channel            TEXT NOT NULL DEFAULT 'LINE',
  status             TEXT NOT NULL DEFAULT 'Open',
  assignee           TEXT NOT NULL DEFAULT 'Unassigned',
  conversation_id    TEXT,
  external_ticket_id TEXT,
  external_system    TEXT,
  external_url       TEXT,
  sla_hours_left     NUMERIC NOT NULL DEFAULT 4,
  sla_formatted      TEXT NOT NULL DEFAULT '4 ชม.',
  sla_status         TEXT NOT NULL DEFAULT 'normal',
  sla_target_note    TEXT,
  order_ref          TEXT,
  order_amount       NUMERIC,
  activity_logs      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at_label   TEXT NOT NULL DEFAULT 'วันนี้',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_service_cases_tenant_updated
  ON service_cases (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_cases_tenant_customer
  ON service_cases (tenant_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_service_cases_tenant_status
  ON service_cases (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_service_cases_tenant_ext_ref
  ON service_cases (tenant_id, external_ticket_id)
  WHERE external_ticket_id IS NOT NULL;

ALTER TABLE service_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_service_cases ON service_cases;
CREATE POLICY tenant_isolation_service_cases ON service_cases
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
