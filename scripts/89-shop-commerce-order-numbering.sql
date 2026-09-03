-- Unified commerce order numbering (Phase 1E.1)
-- Run after scripts/87-shop-locations-foundation.sql
--
-- Adds shop_locations.short_code (Nyanza = NYZ), per-shop daily sequences,
-- and shop_next_order_number(location_id) → EL-NYZ-YYYYMMDD-NNNN.
--
-- Does NOT:
--   - change products.stock or create per-location inventory
--   - rewrite historical orders.order_number values (POS-* / EL-* stay)
--   - invent a second sale_number / receipt_number column
--
-- Then: NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- shop_locations.short_code (human segment in EL-{short}-YYYYMMDD-NNNN)
-- ---------------------------------------------------------------------------
ALTER TABLE shop_locations ADD COLUMN IF NOT EXISTS short_code TEXT;

UPDATE shop_locations
SET short_code = 'NYZ', updated_at = NOW()
WHERE code = 'NYANZA'
  AND (short_code IS DISTINCT FROM 'NYZ');

CREATE UNIQUE INDEX IF NOT EXISTS shop_locations_short_code_unique_idx
  ON shop_locations (short_code)
  WHERE short_code IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'shop_locations_short_code_format'
      AND conrelid = 'shop_locations'::regclass
  ) THEN
    ALTER TABLE shop_locations
      ADD CONSTRAINT shop_locations_short_code_format
      CHECK (short_code IS NULL OR short_code ~ '^[A-Z0-9]{2,4}$');
  END IF;
END $$;

COMMENT ON COLUMN shop_locations.short_code IS
  'Public commerce-number segment (e.g. NYZ). Distinct from machine code NYANZA.';

-- ---------------------------------------------------------------------------
-- Per-shop, per-Kigali-business-day sequence (POS and online share this)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commerce_order_sequences (
  location_id UUID NOT NULL REFERENCES shop_locations(id) ON DELETE RESTRICT,
  business_date DATE NOT NULL,
  last_seq INT NOT NULL CHECK (last_seq >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_id, business_date)
);

ALTER TABLE commerce_order_sequences ENABLE ROW LEVEL SECURITY;
-- No public policies: service-role server APIs only.

COMMENT ON TABLE commerce_order_sequences IS
  'Authoritative daily sequence for unified commerce order numbers. POS and online share one counter per shop per Africa/Kigali date.';

-- ---------------------------------------------------------------------------
-- Unique public order number (NULL historical rows remain allowed)
-- Does not UPDATE existing order_number values.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique_idx
  ON orders (order_number)
  WHERE order_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Allocate next unified number: EL-{SHORT}-{YYYYMMDD}-{NNNN}
-- Row lock via INSERT … ON CONFLICT … last_seq + 1.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION shop_next_order_number(p_location_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  loc_short TEXT;
  loc_status TEXT;
  biz_date DATE;
  next_seq INT;
BEGIN
  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'location_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT upper(trim(short_code)), status
    INTO loc_short, loc_status
  FROM shop_locations
  WHERE id = p_location_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'location_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF loc_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'location_inactive' USING ERRCODE = 'P0001';
  END IF;

  IF loc_short IS NULL OR loc_short !~ '^[A-Z0-9]{2,4}$' THEN
    RAISE EXCEPTION 'invalid_short_code' USING ERRCODE = 'P0001';
  END IF;

  -- Africa/Kigali is UTC+2 year-round (no DST).
  biz_date := (timezone('Africa/Kigali', clock_timestamp()))::date;

  INSERT INTO commerce_order_sequences AS seq (location_id, business_date, last_seq, updated_at)
  VALUES (p_location_id, biz_date, 1, NOW())
  ON CONFLICT (location_id, business_date)
  DO UPDATE SET
    last_seq = seq.last_seq + 1,
    updated_at = NOW()
  RETURNING last_seq INTO next_seq;

  RETURN
    'EL-'
    || loc_short
    || '-'
    || to_char(biz_date, 'YYYYMMDD')
    || '-'
    || lpad(next_seq::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION shop_next_order_number(UUID) IS
  'Allocates the next unified commerce order number for a shop on the current Africa/Kigali business day.';

NOTIFY pgrst, 'reload schema';
