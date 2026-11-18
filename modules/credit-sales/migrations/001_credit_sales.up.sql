-- 001_credit_sales.up.sql
CREATE TABLE IF NOT EXISTS credit_accounts (
  id             TEXT NOT NULL,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id     TEXT NOT NULL,
  grade          TEXT NOT NULL DEFAULT 'B',
  credit_limit   NUMERIC NOT NULL DEFAULT 0,
  credit_used    NUMERIC NOT NULL DEFAULT 0,
  overdue_amount NUMERIC NOT NULL DEFAULT 0,
  aging_bucket   TEXT NOT NULL DEFAULT 'ปกติ',
  next_action    TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_credit_accounts ON credit_accounts;
CREATE POLICY tenant_isolation_credit_accounts ON credit_accounts
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
