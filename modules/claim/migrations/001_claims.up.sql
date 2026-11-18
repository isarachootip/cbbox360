-- 001_claims.up.sql
CREATE TABLE IF NOT EXISTS insurance_claims (
  id             TEXT NOT NULL,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id     TEXT NOT NULL,
  policy_number  TEXT NOT NULL,
  claim_number   TEXT NOT NULL,
  incident_date  DATE NOT NULL,
  claim_amount   NUMERIC NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'Open'
                 CHECK (status IN ('Open', 'Pending', 'Approved', 'Rejected')),
  adjuster_note  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, claim_number)
);

ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_claims ON insurance_claims;
CREATE POLICY tenant_isolation_claims ON insurance_claims
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
