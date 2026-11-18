-- 001_tenant_control_plane.down.sql
DROP TABLE IF EXISTS tenant_connectors;
DROP TABLE IF EXISTS tenant_roles;
DROP TABLE IF EXISTS tenant_labels;
DROP TABLE IF EXISTS tenant_entitlements;
DROP TABLE IF EXISTS tenant_settings;
DROP TABLE IF EXISTS tenant_domains;
DROP TABLE IF EXISTS tenants CASCADE;
