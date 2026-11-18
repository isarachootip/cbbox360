-- 001_orders.down.sql
DROP POLICY IF EXISTS tenant_isolation_ecommerce_orders ON ecommerce_orders;
DROP TABLE IF EXISTS ecommerce_orders;
