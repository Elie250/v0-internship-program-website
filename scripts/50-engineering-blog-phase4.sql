-- Engineering Field Notes Phase 4: engagements, digest preferences, scheduled publishing
-- Run in Supabase SQL Editor after scripts/49-engineering-blog-phase3.sql

CREATE TABLE IF NOT EXISTS engineering_article_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES engineering_articles(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL
    CHECK (engagement_type IN ('bookmark', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_id, engagement_type)
);

CREATE INDEX IF NOT EXISTS engineering_article_engagements_user_type_idx
  ON engineering_article_engagements (user_id, engagement_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS engineering_article_engagements_article_idx
  ON engineering_article_engagements (article_id);

ALTER TABLE engineering_digest_subscribers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE engineering_digest_subscribers
  ADD COLUMN IF NOT EXISTS preferred_tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE engineering_digest_subscribers
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'weekly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'engineering_digest_subscribers_frequency_check'
  ) THEN
    ALTER TABLE engineering_digest_subscribers
      ADD CONSTRAINT engineering_digest_subscribers_frequency_check
      CHECK (frequency IN ('weekly', 'off'));
  END IF;
END $$;

ALTER TABLE engineering_digest_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS engineering_digest_subscribers_token_idx
  ON engineering_digest_subscribers (unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS engineering_digest_subscribers_user_idx
  ON engineering_digest_subscribers (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE engineering_articles
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS engineering_articles_scheduled_idx
  ON engineering_articles (scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND status = 'draft';

NOTIFY pgrst, 'reload schema';
