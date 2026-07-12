-- Energy Library Phase 4: featured reading picks
-- Run in Supabase SQL Editor after scripts/53-energy-library.sql

ALTER TABLE energy_library_items
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS energy_library_items_featured_idx
  ON energy_library_items (is_featured, sort_order)
  WHERE is_featured = true AND status = 'published';

NOTIFY pgrst, 'reload schema';
