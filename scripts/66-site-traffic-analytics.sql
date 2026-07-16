-- Site traffic for Admin (daily rollups — not Vercel Analytics)
-- Run in Supabase after scripts/65-brain-game-engagement.sql

CREATE TABLE IF NOT EXISTS site_traffic_daily (
  day DATE NOT NULL,
  path_group TEXT NOT NULL,
  traffic_source TEXT NOT NULL DEFAULT 'direct'
    CHECK (traffic_source IN (
      'instagram',
      'facebook',
      'tiktok',
      'google',
      'bing',
      'twitter',
      'linkedin',
      'youtube',
      'direct',
      'internal',
      'other'
    )),
  pageviews INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (day, path_group, traffic_source)
);

CREATE TABLE IF NOT EXISTS site_traffic_visitors (
  day DATE NOT NULL,
  traffic_source TEXT NOT NULL,
  visitor_key TEXT NOT NULL,
  PRIMARY KEY (day, traffic_source, visitor_key)
);

CREATE INDEX IF NOT EXISTS idx_site_traffic_daily_day ON site_traffic_daily (day DESC);
CREATE INDEX IF NOT EXISTS idx_site_traffic_visitors_day ON site_traffic_visitors (day DESC);

ALTER TABLE site_traffic_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_traffic_visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_traffic_daily_no_public ON site_traffic_daily;
CREATE POLICY site_traffic_daily_no_public ON site_traffic_daily
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS site_traffic_visitors_no_public ON site_traffic_visitors;
CREATE POLICY site_traffic_visitors_no_public ON site_traffic_visitors
  FOR ALL USING (false) WITH CHECK (false);

NOTIFY pgrst, 'reload schema';
