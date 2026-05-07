-- Database Cleanup Script
-- Run this in your Supabase SQL Editor to delete all leads and tenants
-- NOTE: This will delete ALL data. Make sure you have a backup if needed.

-- Delete all leads (foreign key constraint requires this order)
DELETE FROM leads;

-- Delete all tenants
DELETE FROM tenants;

-- Verify the cleanup (should return 0 rows each)
SELECT COUNT(*) as lead_count FROM leads;
SELECT COUNT(*) as tenant_count FROM tenants;
