-- 001_claims.down.sql
DROP POLICY IF EXISTS tenant_isolation_claims ON insurance_claims;
DROP TABLE IF EXISTS insurance_claims;
