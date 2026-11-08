-- Snapshot selected package terms onto enrollments. Additive / idempotent.
-- Does not update existing enrollment rows or payment history.
-- Run in Supabase SQL Editor after scripts/99-course-pricing-packages.sql.

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES course_pricing_packages(id) ON DELETE SET NULL;

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_name TEXT;

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_currency TEXT;

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_list_price NUMERIC(12, 2);

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_discount_amount NUMERIC(12, 2);

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_final_price NUMERIC(12, 2);

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS package_benefits TEXT;

CREATE INDEX IF NOT EXISTS course_enrollments_package_id_idx
  ON course_enrollments (package_id);

COMMENT ON COLUMN course_enrollments.package_id IS
  'Optional FK to the package chosen at enrollment. Historical amounts live in amount_due and package_* snapshot columns.';

NOTIFY pgrst, 'reload schema';
