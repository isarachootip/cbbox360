-- 001_appointments.up.sql
CREATE TABLE IF NOT EXISTS appointments (
  id           TEXT NOT NULL,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id   TEXT NOT NULL,
  hn           TEXT,
  department   TEXT NOT NULL,
  doctor_name  TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Confirmed'
               CHECK (status IN ('Confirmed', 'Pending', 'Completed', 'Cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_appointments ON appointments;
CREATE POLICY tenant_isolation_appointments ON appointments
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
