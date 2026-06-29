-- Update homepage membership plans (free vs premium features)
-- Run after scripts/04-engineering-hub-platform.sql

INSERT INTO membership_plans (name, plan_type, benefits, features, price, billing_period, cta_label, cta_url, status, sort_order)
VALUES
  (
    'Free',
    'free',
    '["Career guidance & mentorship content", "Public webinars & events", "Browse free training programmes", "Engineer community (read & reply)"]'::jsonb,
    '[]'::jsonb,
    0,
    'year',
    'Get started free',
    '/auth/register',
    'published',
    0
  ),
  (
    'Premium',
    'premium',
    '["All paid training, internship & workshop programmes", "Human support tickets with SLA", "AI technical assistant", "Engineer community — start discussions", "Priority enrollment after MoMo review", "Certificates on eligible programmes"]'::jsonb,
    '["Training & internship tracks", "Engineering support subscription", "Workshops & webinars", "Student portal & course materials"]'::jsonb,
    35000,
    'programme',
    'Sign in for premium',
    '/auth/login?redirect=%2Fstudent%2Fcourses',
    'published',
    1
  )
ON CONFLICT DO NOTHING;

-- Upsert by plan_type if rows already exist (no unique on plan_type — update by type)
UPDATE membership_plans SET
  name = 'Free',
  benefits = '["Career guidance & mentorship content", "Public webinars & events", "Browse free training programmes", "Engineer community (read & reply)"]'::jsonb,
  price = 0,
  billing_period = 'year',
  status = 'published',
  updated_at = NOW()
WHERE plan_type = 'free';

UPDATE membership_plans SET
  name = 'Premium',
  benefits = '["All paid training, internship & workshop programmes", "Human support tickets with SLA", "AI technical assistant", "Engineer community — start discussions", "Priority enrollment after MoMo review", "Certificates on eligible programmes"]'::jsonb,
  features = '["Training & internship tracks", "Engineering support subscription", "Workshops & webinars", "Student portal & course materials"]'::jsonb,
  price = 35000,
  billing_period = 'programme',
  status = 'published',
  updated_at = NOW()
WHERE plan_type = 'premium';

NOTIFY pgrst, 'reload schema';
