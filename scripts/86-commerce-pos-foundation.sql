-- Commerce / POS foundation: staff sessions, atomic stock, reservations, movements, idempotency
-- Run in Supabase SQL editor after scripts/41-shop-financial-pos.sql
-- Then: NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Roles: salesperson + inventory_manager (shop staff without full admin)
-- ---------------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (
    role IN (
      'student',
      'registered',
      'mentor',
      'lecturer',
      'instructor',
      'engineer',
      'support_staff',
      'admin',
      'salesperson',
      'inventory_manager'
    )
  );

INSERT INTO roles (slug, name, description, is_system) VALUES
  ('salesperson', 'Salesperson', 'POS sales and order visibility without admin console', true),
  ('inventory_manager', 'Inventory Manager', 'Stock and product inventory without full admin', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO permissions (key, module, action, description) VALUES
  ('shop:pos_sell', 'shop', 'pos_sell', 'Create POS sales (cash / MoMo)'),
  ('shop:sales_view', 'shop', 'sales_view', 'View POS and shop sales history'),
  ('shop:stock_view', 'shop', 'stock_view', 'View inventory levels'),
  ('shop:stock_adjust', 'shop', 'stock_adjust', 'Adjust inventory and record movements'),
  ('shop:orders_view', 'shop', 'orders_view', 'View online and POS orders'),
  ('shop:orders_manage', 'shop', 'orders_manage', 'Update order fulfillment status')
ON CONFLICT (key) DO NOTHING;

-- Grant new shop permissions to admin role mapping table
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key IN (
    'shop:pos_sell',
    'shop:sales_view',
    'shop:stock_view',
    'shop:stock_adjust',
    'shop:orders_view',
    'shop:orders_manage'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'salesperson'
  AND p.key IN (
    'shop:pos_sell',
    'shop:sales_view',
    'shop:stock_view',
    'shop:orders_view'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'inventory_manager'
  AND p.key IN (
    'shop:products',
    'shop:stock_view',
    'shop:stock_adjust',
    'shop:categories'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Product barcode (optional; SKU remains Phase 1 scan key)
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique_idx
  ON products (barcode)
  WHERE barcode IS NOT NULL AND length(trim(barcode)) > 0;

-- ---------------------------------------------------------------------------
-- Orders: idempotency key (POS / retry-safe checkout)
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_state TEXT DEFAULT 'none';
-- stock_state: none | reserved | consumed | released
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique_idx
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Staff mobile sessions (Bearer token; hash stored server-side)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS staff_sessions_user_id_idx ON staff_sessions (user_id);
CREATE INDEX IF NOT EXISTS staff_sessions_expires_at_idx ON staff_sessions (expires_at);

ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Idempotency store (completed responses for retries)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commerce_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('processing', 'completed', 'failed')),
  response_status INT,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS commerce_idempotency_actor_idx
  ON commerce_idempotency_keys (actor_user_id);

ALTER TABLE commerce_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Stock movements ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL
    CHECK (
      movement_type IN (
        'SALE',
        'PURCHASE',
        'ADJUSTMENT',
        'RETURN',
        'DAMAGE',
        'TRANSFER',
        'RESERVE',
        'RELEASE'
      )
    ),
  quantity_delta INT NOT NULL,
  quantity_before INT,
  quantity_after INT,
  reason TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reservation_id UUID,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS stock_movements_order_id_idx ON stock_movements (order_id);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements (movement_type);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Stock reservations (MoMo / unpaid holds)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'converted', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS stock_reservations_order_id_idx ON stock_reservations (order_id);
CREATE INDEX IF NOT EXISTS stock_reservations_status_idx ON stock_reservations (status);
CREATE UNIQUE INDEX IF NOT EXISTS stock_reservations_active_order_product_idx
  ON stock_reservations (order_id, product_id)
  WHERE status = 'active';

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Link movements.reservation_id after table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_movements_reservation_id_fkey'
  ) THEN
    ALTER TABLE stock_movements
      ADD CONSTRAINT stock_movements_reservation_id_fkey
      FOREIGN KEY (reservation_id) REFERENCES stock_reservations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Atomic stock RPCs (prevent oversell under concurrency)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION shop_consume_stock(p_product_id UUID, p_quantity INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  new_stock INT;
BEGIN
  IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'P0001';
  END IF;

  UPDATE products
  SET
    stock = stock - p_quantity,
    in_stock = (stock - p_quantity) > 0,
    updated_at = NOW()
  WHERE id = p_product_id
    AND COALESCE(stock, 0) >= p_quantity
  RETURNING stock INTO new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001';
  END IF;

  RETURN new_stock;
END;
$$;

CREATE OR REPLACE FUNCTION shop_release_stock(p_product_id UUID, p_quantity INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  new_stock INT;
BEGIN
  IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'P0001';
  END IF;

  UPDATE products
  SET
    stock = COALESCE(stock, 0) + p_quantity,
    in_stock = TRUE,
    updated_at = NOW()
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found' USING ERRCODE = 'P0001';
  END IF;

  RETURN new_stock;
END;
$$;

CREATE OR REPLACE FUNCTION shop_set_stock(p_product_id UUID, p_new_stock INT)
RETURNS TABLE(quantity_before INT, quantity_after INT)
LANGUAGE plpgsql
AS $$
DECLARE
  before_stock INT;
BEGIN
  IF p_product_id IS NULL OR p_new_stock IS NULL OR p_new_stock < 0 THEN
    RAISE EXCEPTION 'invalid_stock' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(stock, 0) INTO before_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found' USING ERRCODE = 'P0001';
  END IF;

  UPDATE products
  SET
    stock = p_new_stock,
    in_stock = p_new_stock > 0,
    updated_at = NOW()
  WHERE id = p_product_id;

  quantity_before := before_stock;
  quantity_after := p_new_stock;
  RETURN NEXT;
END;
$$;

NOTIFY pgrst, 'reload schema';
