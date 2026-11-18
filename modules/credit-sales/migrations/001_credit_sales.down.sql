-- 001_credit_sales.down.sql
DROP POLICY IF EXISTS tenant_isolation_credit_accounts ON credit_accounts;
DROP TABLE IF EXISTS credit_accounts;
