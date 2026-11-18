-- 001_orders.up.sql
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id              TEXT NOT NULL,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      TEXT NOT NULL,
  order_code      TEXT NOT NULL,
  tracking_number TEXT,
  total_amount    NUMERIC NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Open',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, order_code)
);

ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_ecommerce_orders ON ecommerce_orders;
CREATE POLICY tenant_isolation_ecommerce_orders ON ecommerce_orders
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
