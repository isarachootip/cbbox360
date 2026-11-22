-- 007_case_field_service_fields.down.sql
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS resolution_summary;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS root_cause;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS reporter_phone;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS reporter_name;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS site_location;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS asset_serial;
ALTER TABLE IF EXISTS service_cases DROP COLUMN IF EXISTS service_mode;
