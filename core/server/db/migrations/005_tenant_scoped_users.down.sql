-- 005_tenant_scoped_users.down.sql
DROP INDEX IF EXISTS idx_users_tenant_username;
CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
