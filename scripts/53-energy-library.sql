-- Energy Library Phase 1: public gallery, books, and culture items
-- Run in Supabase SQL Editor after scripts/52-course-pending-review.sql

CREATE TABLE IF NOT EXISTS energy_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  pillar TEXT NOT NULL
    CHECK (pillar IN ('gallery', 'books', 'culture')),
  culture_type TEXT
    CHECK (culture_type IS NULL OR culture_type IN ('inkuru', 'ibisigo', 'imivugo', 'creative', 'other')),
  body TEXT,
  cover_image_url TEXT,
  file_url TEXT,
  gallery_images TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT,
  language TEXT NOT NULL DEFAULT 'rw',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploader_role TEXT,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  view_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS energy_library_items_pillar_status_idx
  ON energy_library_items (pillar, status, sort_order)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS energy_library_items_slug_idx
  ON energy_library_items (slug);

CREATE INDEX IF NOT EXISTS energy_library_items_published_at_idx
  ON energy_library_items (published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS energy_library_items_culture_type_idx
  ON energy_library_items (culture_type, sort_order)
  WHERE pillar = 'culture' AND status = 'published';

NOTIFY pgrst, 'reload schema';
