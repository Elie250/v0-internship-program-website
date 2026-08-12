-- Test helper: attach dmexploration659@gmail.com to EasyFab as organization_admin
-- and clear candidate-only / pending-employer onboarding state for that user.
-- Run in Supabase SQL Editor (after migrations 68+ and 77).
-- Does NOT create the user — they must have signed in on Talent at least once.

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_email TEXT := lower(trim('dmexploration659@gmail.com'));
BEGIN
  SELECT id INTO v_user_id
  FROM users
  WHERE lower(trim(email)) = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'No users row for %. Open Talent, Continue with Email once, then re-run this script.',
      v_email;
  END IF;

  SELECT id INTO v_org_id
  FROM recruitment_organizations
  WHERE lower(slug) = 'easyfab'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'EasyFab organization (slug=easyfab) not found. Run scripts/68 first.';
  END IF;

  -- Ensure EasyFab is active so membership grants workspace access
  UPDATE recruitment_organizations
  SET status = 'active', updated_at = NOW()
  WHERE id = v_org_id
    AND status IS DISTINCT FROM 'active';

  -- Remove candidate profile for this test email
  DELETE FROM recruitment_candidate_profiles
  WHERE user_id = v_user_id;

  -- Stop pending employer onboarding from blocking /employer
  UPDATE recruitment_organization_requests
  SET
    status = 'withdrawn',
    updated_at = NOW(),
    review_notes = COALESCE(review_notes, 'Withdrawn for EasyFab test membership setup')
  WHERE requester_user_id = v_user_id
    AND status = 'pending';

  -- Grant EasyFab organization admin (server-side membership — not client role)
  INSERT INTO recruitment_organization_memberships (
    organization_id,
    user_id,
    role,
    status,
    updated_at
  )
  VALUES (
    v_org_id,
    v_user_id,
    'organization_admin',
    'active',
    NOW()
  )
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = NOW();

  RAISE NOTICE 'OK: % is organization_admin on EasyFab (%). Sign in again and open /employer.',
    v_email, v_org_id;
END $$;

-- Verify
SELECT
  u.email,
  o.name AS organization,
  o.slug,
  o.status AS org_status,
  m.role,
  m.status AS membership_status,
  EXISTS (
    SELECT 1 FROM recruitment_candidate_profiles cp WHERE cp.user_id = u.id
  ) AS still_has_candidate_profile,
  (
    SELECT r.status
    FROM recruitment_organization_requests r
    WHERE r.requester_user_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 1
  ) AS latest_request_status
FROM users u
JOIN recruitment_organization_memberships m ON m.user_id = u.id
JOIN recruitment_organizations o ON o.id = m.organization_id
WHERE lower(trim(u.email)) = lower(trim('dmexploration659@gmail.com'))
  AND lower(o.slug) = 'easyfab';
