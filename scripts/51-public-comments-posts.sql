-- Public community features: article comments + engineer profile posts
-- Run in Supabase SQL Editor after scripts/50-engineering-blog-phase4.sql

-- Comments on Field Notes articles (any signed-in account, no subscription needed)
CREATE TABLE IF NOT EXISTS engineering_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES engineering_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engineering_article_comments_article_idx
  ON engineering_article_comments (article_id, created_at DESC);

-- Public posts engineers publish on their own profile page
CREATE TABLE IF NOT EXISTS engineer_profile_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engineer_profile_posts_author_idx
  ON engineer_profile_posts (author_id, created_at DESC);

-- Comments on profile posts (any signed-in account)
CREATE TABLE IF NOT EXISTS engineer_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES engineer_profile_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engineer_post_comments_post_idx
  ON engineer_post_comments (post_id, created_at DESC);

-- Track last weekly digest send per subscriber (protect Resend quota)
ALTER TABLE engineering_digest_subscribers
  ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
