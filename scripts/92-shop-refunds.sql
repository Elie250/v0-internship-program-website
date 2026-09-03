-- Shop POS refunds: separate auditable transactions. Original sales stay immutable.
-- Run in Supabase SQL editor after scripts/86-commerce-pos-foundation.sql
-- Then: NOTIFY pgrst, 'reload schema';
--
-- Does NOT rewrite orders / order_items / payments for completed sales.
-- Academy payment refunds (payments.status = refunded) remain a separate primitive.

INSERT INTO permissions (key, module, action, description) VALUES
  ('shop:refunds_request', 'shop', 'refunds_request', 'Request a refund against a completed POS sale'),
  ('shop:refunds_approve', 'shop', 'refunds_approve', 'Approve or reject shop POS refunds and restore stock')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key IN ('shop:refunds_request', 'shop:refunds_approve')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug IN ('salesperson', 'inventory_manager')
  AND p.key = 'shop:refunds_request'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS shop_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected')),
  reason TEXT NOT NULL
    CHECK (
      reason IN (
        'customer_return',
        'wrong_item',
        'damaged_item',
        'duplicate_sale',
        'incorrect_quantity',
        'other'
      )
    ),
  notes TEXT,
  payment_method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS shop_refunds_idempotency_key_idx
  ON shop_refunds (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS shop_refunds_order_id_idx ON shop_refunds (order_id);
CREATE INDEX IF NOT EXISTS shop_refunds_status_idx ON shop_refunds (status);
CREATE INDEX IF NOT EXISTS shop_refunds_decided_at_idx ON shop_refunds (decided_at DESC);

CREATE TABLE IF NOT EXISTS shop_refund_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES shop_refunds(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS shop_refund_lines_refund_id_idx ON shop_refund_lines (refund_id);
CREATE INDEX IF NOT EXISTS shop_refund_lines_order_item_id_idx ON shop_refund_lines (order_item_id);

ALTER TABLE shop_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_refund_lines ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
