-- One-time course pricing packages. Additive / idempotent.
-- Does not change courses.pricing, enrollments, or payments.
-- Run in Supabase SQL Editor after scripts/98-course-report-publication.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

CREATE TABLE IF NOT EXISTS course_pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  benefits TEXT,
  currency TEXT NOT NULL DEFAULT 'RWF',
  list_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_price NUMERIC(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Writers set updated_at in application code (same convention as scripts/97).
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT course_pricing_packages_currency_check CHECK (currency = 'RWF'),
  CONSTRAINT course_pricing_packages_list_price_check CHECK (list_price >= 0),
  CONSTRAINT course_pricing_packages_discount_check CHECK (discount_amount >= 0),
  CONSTRAINT course_pricing_packages_final_price_check CHECK (final_price >= 0),
  CONSTRAINT course_pricing_packages_discount_lte_list_check CHECK (discount_amount <= list_price)
);

CREATE INDEX IF NOT EXISTS course_pricing_packages_course_active_idx
  ON course_pricing_packages (course_id, is_active);

CREATE INDEX IF NOT EXISTS course_pricing_packages_course_sort_idx
  ON course_pricing_packages (course_id, sort_order);

ALTER TABLE course_pricing_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_pricing_packages_no_direct_access" ON course_pricing_packages;
CREATE POLICY "course_pricing_packages_no_direct_access"
  ON course_pricing_packages
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE course_pricing_packages IS
  'Admin-managed one-time pricing options per course. Students select an active package at enrollment; terms are snapshotted onto course_enrollments.';

NOTIFY pgrst, 'reload schema';
