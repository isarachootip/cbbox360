-- 004_tenant_scoped_customers_and_chats.down.sql
DROP POLICY IF EXISTS tenant_isolation_messages ON messages;
DROP POLICY IF EXISTS tenant_isolation_conversations ON conversations;
DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
