-- 007_case_field_service_fields.up.sql
-- Adds field-service metadata (service mode, asset serial, site location, on-site reporter)
-- and resolution tracking (root cause, resolution summary) to tenant-scoped service_cases.

ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS service_mode TEXT NOT NULL DEFAULT 'Remote';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS asset_serial TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS site_location TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS reporter_name TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS reporter_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS root_cause TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS service_cases ADD COLUMN IF NOT EXISTS resolution_summary TEXT NOT NULL DEFAULT '';
