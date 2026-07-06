-- Seed public company content for Energy & Logics Ltd
-- Run in Supabase SQL Editor after scripts/04-engineering-hub-platform.sql

INSERT INTO site_settings (key, value) VALUES
  ('about_content', 'Energy & Logics Ltd is a Rwanda-based engineering company focused on practical training, technical support, and career pathways for students, graduates, and technicians across East Africa.

Through our Engineering Hub platform, we deliver structured programmes in embedded systems, industrial control, and advanced electrical technology—combining classroom instruction, lab work, and real project experience.'),
  ('mission_content', 'We bridge the gap between classroom theory and industry practice by delivering hands-on engineering training, mentorship, and technical support—so our learners are ready to work, build, and solve real problems in Rwanda and the wider region.'),
  ('company_email', 'admin@energyandlogics.com'),
  ('company_phone', '+250783986252'),
  ('company_address', 'Kigali, Rwanda'),
  ('payment_momo_code', '4402091'),
  ('payment_account_name', 'Energy and Logics Ltd'),
  ('founder_name', 'Elie Bisamaza'),
  ('founder_title', 'Embedded Systems Engineer')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

INSERT INTO site_hero (title, subtitle, background_image, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url, is_active)
SELECT
  'Energy & Logics — Engineering Training',
  'Hands-on programmes in embedded systems, industrial control, and advanced electrical technology. Based in Kigali, Rwanda.',
  '/hero-laboratory.jpg',
  'View Programmes',
  '/learning',
  'About our founder',
  '/about',
  true
WHERE NOT EXISTS (SELECT 1 FROM site_hero WHERE is_active = true);

NOTIFY pgrst, 'reload schema';
