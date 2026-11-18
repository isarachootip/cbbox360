-- 001_appointments.down.sql
DROP POLICY IF EXISTS tenant_isolation_appointments ON appointments;
DROP TABLE IF EXISTS appointments;
