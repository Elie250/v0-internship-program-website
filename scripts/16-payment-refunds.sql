-- Refunds: mark payments refunded and revoke student course access
-- Status values (TEXT columns — no constraint change required):
--   payments.status = 'refunded'
--   course_enrollments.status = 'refunded'

CREATE INDEX IF NOT EXISTS payments_refunded_idx ON payments (created_at DESC)
  WHERE status = 'refunded';

CREATE INDEX IF NOT EXISTS course_enrollments_refunded_idx ON course_enrollments (created_at DESC)
  WHERE status = 'refunded';

NOTIFY pgrst, 'reload schema';
