-- Shop locations foundation (Phase 1C.2)
-- Run after scripts/86-commerce-pos-foundation.sql
--
-- Introduces shop_locations and optional orders.location_id attribution.
-- Does NOT change products.stock or create per-location inventory.
--
-- Then: NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- shop_locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shop_locations_code_unique UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS shop_locations_status_idx ON shop_locations (status);
CREATE INDEX IF NOT EXISTS shop_locations_code_idx ON shop_locations (code);

ALTER TABLE shop_locations ENABLE ROW LEVEL SECURITY;
-- No public policies: access via service-role server APIs only (same pattern as staff_sessions).

-- Idempotent seed: Energy & Logics — Nyanza Shop
INSERT INTO shop_locations (name, code, status)
VALUES ('Nyanza Shop', 'NYANZA', 'active')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- orders.location_id — nullable attribution only (not inventory partitioning)
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_location_id_fkey'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES shop_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders (location_id);

COMMENT ON TABLE shop_locations IS
  'Physical Energy & Logics shop sites. Inventory quantities remain on products.stock until a future location-aware stock migration.';

COMMENT ON COLUMN orders.location_id IS
  'Optional shop site that fulfilled or originated the order. NULL is valid for historical/online orders. Does not imply per-location stock.';

NOTIFY pgrst, 'reload schema';
