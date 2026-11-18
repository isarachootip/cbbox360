-- 001_policies.down.sql
DROP POLICY IF EXISTS tenant_isolation_policies ON insurance_policies;
DROP TABLE IF EXISTS insurance_policies;
