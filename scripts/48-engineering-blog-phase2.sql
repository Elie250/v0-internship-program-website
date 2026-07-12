-- Engineering blog Phase 2: article discussions + author linkage
-- Run in Supabase SQL Editor after scripts/47-engineering-blog.sql

ALTER TABLE engineer_discussions ADD COLUMN IF NOT EXISTS article_id UUID
  REFERENCES engineering_articles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS engineer_discussions_article_unique_idx
  ON engineer_discussions (article_id)
  WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS engineer_discussions_article_lookup_idx
  ON engineer_discussions (article_id)
  WHERE article_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
