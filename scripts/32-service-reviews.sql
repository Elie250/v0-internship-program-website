-- Service & platform reviews for trust building
-- Run in Supabase SQL Editor. Choose "Run and enable RLS" when prompted.

CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID,
  user_id UUID,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  reviewer_role TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'general'
    CHECK (context IN ('training', 'internship', 'engineering_support', 'shop', 'career_events', 'general')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_status ON service_reviews(status);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_service_reviews_created ON service_reviews(created_at DESC);

ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_reviews" ON service_reviews;
CREATE POLICY "public_read_published_reviews" ON service_reviews
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "deny_public_insert_reviews" ON service_reviews;
CREATE POLICY "deny_public_insert_reviews" ON service_reviews
  FOR INSERT WITH CHECK (false);
