-- 006_tenant_scoped_cases.down.sql
DROP POLICY IF EXISTS tenant_isolation_service_cases ON service_cases;
DROP TABLE IF EXISTS service_cases;
