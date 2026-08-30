-- Shop inventory / pricing / replenishment permissions and additive catalog fields.
-- Run in Supabase SQL editor after scripts/92-shop-refunds.sql
-- Then: NOTIFY pgrst, 'reload schema';
--
-- Additive only: no DROPs, no hard-deletes, no rewrite of orders / stock_movements.

INSERT INTO permissions (key, module, action, description) VALUES
  ('shop:stock_receive', 'shop', 'stock_receive', 'Receive incoming stock without full inventory-manager authority'),
  ('shop:cost_price', 'shop', 'cost_price', 'View and edit product cost price'),
  ('shop:selling_price', 'shop', 'selling_price', 'Edit product selling price'),
  ('shop:replenishment_view', 'shop', 'replenishment_view', 'View low-stock and replenishment suggestions'),
  ('shop:purchase_request', 'shop', 'purchase_request', 'Create a purchase request from replenishment'),
  ('shop:payments_review', 'shop', 'payments_review', 'Approve or reject Nyanza Shop customer MoMo proofs')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key IN (
    'shop:stock_receive',
    'shop:cost_price',
    'shop:selling_price',
    'shop:replenishment_view',
    'shop:purchase_request',
    'shop:payments_review'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'inventory_manager'
  AND p.key IN (
    'shop:stock_receive',
    'shop:cost_price',
    'shop:selling_price',
    'shop:replenishment_view',
    'shop:purchase_request'
  )
ON CONFLICT DO NOTHING;

-- Salesperson is POS-focused. Inventory view is no longer a role default.
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE slug = 'salesperson')
  AND permission_id IN (SELECT id FROM permissions WHERE key = 'shop:stock_view');

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS target_stock INT;

CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  field TEXT NOT NULL CHECK (field IN ('cost_price', 'selling_price')),
  old_value NUMERIC(12, 2),
  new_value NUMERIC(12, 2) NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_price_history_product_id_idx
  ON product_price_history (product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shop_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'cancelled', 'received')),
  notes TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shop_purchase_requests_product_id_idx
  ON shop_purchase_requests (product_id, status);
CREATE INDEX IF NOT EXISTS shop_purchase_requests_status_idx
  ON shop_purchase_requests (status, created_at DESC);

ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION shop_add_stock(p_product_id UUID, p_delta INT)
RETURNS TABLE(quantity_before INT, quantity_after INT)
LANGUAGE plpgsql
AS $$
DECLARE
  before_stock INT;
  after_stock INT;
BEGIN
  IF p_product_id IS NULL OR p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'invalid_stock' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(stock, 0) INTO before_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found' USING ERRCODE = 'P0001';
  END IF;

  after_stock := before_stock + p_delta;
  IF after_stock < 0 THEN
    RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001';
  END IF;

  UPDATE products
  SET
    stock = after_stock,
    in_stock = after_stock > 0,
    updated_at = NOW()
  WHERE id = p_product_id;

  quantity_before := before_stock;
  quantity_after := after_stock;
  RETURN NEXT;
END;
$$;

NOTIFY pgrst, 'reload schema';
