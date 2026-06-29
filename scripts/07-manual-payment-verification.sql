-- Manual payment verification fields (no payment gateway)
-- Admin visually checks receipt_url and approves/rejects in admin panel

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_email TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_phone TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
CREATE INDEX IF NOT EXISTS payments_pending_review_idx ON payments (created_at DESC)
  WHERE status IN ('pending_review', 'Pending', 'pending');

-- Seed permission keys for manual payment review (if permissions table exists)
INSERT INTO permissions (key, module, action, description) VALUES
  ('payments:view', 'payments', 'view', 'View submitted payment receipts'),
  ('payments:approve', 'payments', 'approve', 'Approve or reject manual payments after receipt review')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('payments:view', 'payments:approve')
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
