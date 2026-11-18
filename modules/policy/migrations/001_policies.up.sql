-- 001_policies.up.sql
CREATE TABLE IF NOT EXISTS insurance_policies (
  id             TEXT NOT NULL,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id     TEXT NOT NULL,
  policy_number  TEXT NOT NULL,
  policy_type    TEXT NOT NULL,
  sum_insured    NUMERIC NOT NULL DEFAULT 0,
  expiry_date    DATE NOT NULL,
  agent_name     TEXT,
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Pending', 'Expired')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, policy_number)
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policies ON insurance_policies;
CREATE POLICY tenant_isolation_policies ON insurance_policies
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
