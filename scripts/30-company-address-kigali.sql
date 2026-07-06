-- Update company location to Kigali (run in Supabase SQL Editor)
UPDATE site_settings SET value = 'Kigali, Rwanda', updated_at = NOW() WHERE key = 'company_address';
