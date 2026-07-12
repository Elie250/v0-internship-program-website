-- Engineering blog Phase 3: series, lead magnets, view analytics
-- Run in Supabase SQL Editor after scripts/48-engineering-blog-phase2.sql

CREATE TABLE IF NOT EXISTS engineering_article_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE engineering_articles ADD COLUMN IF NOT EXISTS series_id UUID
  REFERENCES engineering_article_series(id) ON DELETE SET NULL;
ALTER TABLE engineering_articles ADD COLUMN IF NOT EXISTS series_sort_order INT;
ALTER TABLE engineering_articles ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS engineering_lead_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  download_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineering_lead_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_magnet_id UUID NOT NULL REFERENCES engineering_lead_magnets(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engineering_article_series_status_idx
  ON engineering_article_series (status, sort_order);

CREATE INDEX IF NOT EXISTS engineering_articles_series_idx
  ON engineering_articles (series_id, series_sort_order)
  WHERE series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS engineering_articles_view_count_idx
  ON engineering_articles (view_count DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS engineering_lead_downloads_magnet_idx
  ON engineering_lead_downloads (lead_magnet_id, downloaded_at DESC);

NOTIFY pgrst, 'reload schema';
