-- Energy Library: comments on published culture items
-- Run in Supabase SQL Editor after scripts/54-energy-library-phase4.sql

CREATE TABLE IF NOT EXISTS energy_library_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES energy_library_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS energy_library_comments_item_idx
  ON energy_library_comments (item_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
