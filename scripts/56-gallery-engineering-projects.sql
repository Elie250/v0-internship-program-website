-- Gallery engineering projects showcase (admin-uploaded)
-- Run after scripts/55-energy-library-comments.sql

ALTER TABLE energy_library_items ADD COLUMN IF NOT EXISTS gallery_type TEXT
  CHECK (gallery_type IS NULL OR gallery_type IN ('photo', 'engineering_project'));

ALTER TABLE energy_library_items ADD COLUMN IF NOT EXISTS project_team TEXT;
ALTER TABLE energy_library_items ADD COLUMN IF NOT EXISTS project_year INT;
ALTER TABLE energy_library_items ADD COLUMN IF NOT EXISTS tech_stack TEXT[] NOT NULL DEFAULT '{}';

UPDATE energy_library_items
SET gallery_type = 'photo'
WHERE pillar = 'gallery' AND gallery_type IS NULL;

CREATE INDEX IF NOT EXISTS energy_library_items_gallery_type_idx
  ON energy_library_items (gallery_type, sort_order)
  WHERE pillar = 'gallery' AND status = 'published';

NOTIFY pgrst, 'reload schema';
