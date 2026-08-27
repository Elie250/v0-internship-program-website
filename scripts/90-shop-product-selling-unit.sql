-- Product customer selling unit (Phase 1E.3-E)
-- Run after scripts/89-shop-commerce-order-numbering.sql
--
-- Adds products.selling_quantity and products.selling_unit.
-- Existing rows receive DEFAULT 1 / 'PCS' (one selling unit).
--
-- Commercial meaning:
--   price / discount apply to ONE selling unit (e.g. 5 M × 8,000 RWF).
--   Cart / POS quantity is the number of selling units (2 × 5 M decreases stock by 2).
--   products.stock remains a count of sellable units — not metres, kilograms, or millilitres.
--
-- Does NOT:
--   - convert units or reinterpret products.stock
--   - snapshot units onto order_items
--   - create product-location inventory
--   - add EBM fields
--   - rewrite historical order_number values (POS-* / EL-* stay)
--   - create new order/sales tables
--
-- Then: NOTIFY pgrst, 'reload schema';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS selling_quantity NUMERIC(12,3) NOT NULL DEFAULT 1;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS selling_unit TEXT NOT NULL DEFAULT 'PCS';

UPDATE products
SET selling_quantity = 1
WHERE selling_quantity IS NULL OR selling_quantity <= 0;

UPDATE products
SET selling_unit = 'PCS'
WHERE selling_unit IS NULL
   OR btrim(selling_unit) = ''
   OR selling_unit NOT IN (
     'PCS', 'PACK', 'SET', 'PAIR', 'M', 'CM', 'MM', 'KG', 'G', 'L', 'ML'
   );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_selling_quantity_positive'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_selling_quantity_positive
      CHECK (selling_quantity > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_selling_unit_allowed'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_selling_unit_allowed
      CHECK (selling_unit IN (
        'PCS', 'PACK', 'SET', 'PAIR', 'M', 'CM', 'MM', 'KG', 'G', 'L', 'ML'
      ));
  END IF;
END $$;

COMMENT ON COLUMN products.selling_quantity IS
  'Customer selling quantity for one sellable unit. Price applies to this quantity + unit. Not warehouse conversion.';

COMMENT ON COLUMN products.selling_unit IS
  'Customer selling unit abbreviation (PCS, PACK, SET, PAIR, M, CM, MM, KG, G, L, ML). Stock remains a count of sellable units.';

NOTIFY pgrst, 'reload schema';
