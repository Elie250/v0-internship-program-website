-- Engineering Field Notes blog (Phase 1)
-- Run in Supabase SQL Editor after scripts/18-engineer-community-plan-tiers.sql

CREATE TABLE IF NOT EXISTS engineering_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineering_digest_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS engineering_articles_status_published_idx
  ON engineering_articles (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS engineering_articles_slug_idx ON engineering_articles (slug);
CREATE INDEX IF NOT EXISTS engineering_articles_featured_idx ON engineering_articles (is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS engineering_digest_subscribers_active_idx
  ON engineering_digest_subscribers (status)
  WHERE status = 'active';

NOTIFY pgrst, 'reload schema';
