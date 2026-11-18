-- 002_custom_fields_and_rls.down.sql
DROP POLICY IF EXISTS tenant_isolation_field_defs ON field_definitions;
DROP POLICY IF EXISTS tenant_isolation_cases ON cases;
DROP TABLE IF EXISTS cases;
DROP TABLE IF EXISTS case_categories;
DROP TABLE IF EXISTS sla_policies;
DROP TABLE IF EXISTS custom_field_index;
DROP TABLE IF EXISTS field_definitions;
