-- Tighten lecturer/instructor RBAC: classroom portal only (no admin console permissions)
-- Run in Supabase SQL Editor after scripts/06-rbac-permissions.sql

UPDATE users
SET permissions = '[]'::jsonb,
    updated_at = NOW()
WHERE role IN ('lecturer', 'instructor')
  AND (
    permissions IS NULL
    OR permissions != '[]'::jsonb
  );

INSERT INTO roles (slug, name, description, is_system) VALUES
  ('lecturer', 'Lecturer', 'Classroom delivery — /lecturer portal only', true)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
