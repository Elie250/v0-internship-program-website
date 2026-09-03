-- Staff-controlled storefront featured flag (Phase 1E.4)
-- Run after scripts/90-shop-product-selling-unit.sql
--
-- Adds products.is_featured for catalogue managers (shop:products).
-- Hero prefers featured, in-stock products that have a photo.
-- Trends stay derived. Deals stay discount > 0 with a lower selling price.
--
-- Does NOT:
--   - add extra ranking columns
--   - create a second catalogue or pricing system
--   - change stock, selling_quantity, or selling_unit semantics
--   - expose cost price
--   - rewrite orders, POS, or payment flows
--
-- Then: NOTIFY pgrst, 'reload schema';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.is_featured IS
  'Staff-controlled storefront highlight. Hero prefers featured in-stock products with photos. Not a Trends or Deals flag.';

NOTIFY pgrst, 'reload schema';
