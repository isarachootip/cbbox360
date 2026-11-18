-- 005_tenant_scoped_users.up.sql
-- Replaces global username uniqueness with per-tenant uniqueness (tenant_id, LOWER(username))
-- so each customer tenant can independently manage its own `admin`, `doctor`, `agent` accounts.

ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_username_key;
DROP INDEX IF EXISTS idx_users_username;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON users (tenant_id, LOWER(username));
