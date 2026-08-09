-- Student name/password self-edit (admin-controlled registration period)
-- Run in Supabase SQL Editor.
--
-- 1) Schema: global period flag + per-student lock
-- 2) Fix mistyped name for Edison (email matches Bayisenge, not Bayibiyehe)

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS self_edit_locked BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.self_edit_locked IS
  'When true, student cannot edit name or password even if registration period is open.';

INSERT INTO site_settings (key, value)
VALUES ('student_account_edits_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Inspect current record
-- ---------------------------------------------------------------------------
SELECT id, email, first_name, last_name, role, status, self_edit_locked
FROM users
WHERE lower(email) = lower('bayisengeedison0@gmail.com');

-- ---------------------------------------------------------------------------
-- Correct mistyped surname: Bayibiyehe → Bayisenge
-- ---------------------------------------------------------------------------
UPDATE users
SET
  first_name = 'Edison',
  last_name = 'Bayisenge',
  updated_at = NOW()
WHERE lower(email) = lower('bayisengeedison0@gmail.com');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) THEN
    UPDATE students
    SET full_name = 'Edison Bayisenge', updated_at = NOW()
    WHERE lower(email) = lower('bayisengeedison0@gmail.com');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'registrations'
  ) THEN
    UPDATE registrations
    SET name = 'Edison Bayisenge', updated_at = NOW()
    WHERE lower(email) = lower('bayisengeedison0@gmail.com');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_certificates'
  ) THEN
    UPDATE student_certificates sc
    SET student_name = 'Edison Bayisenge'
    FROM users u
    WHERE sc.user_id = u.id
      AND lower(u.email) = lower('bayisengeedison0@gmail.com');
  END IF;
END $$;

-- Confirm
SELECT id, email, first_name, last_name, role, status
FROM users
WHERE lower(email) = lower('bayisengeedison0@gmail.com');

NOTIFY pgrst, 'reload schema';
