-- Brain Training engagement analytics (plays + traffic source)
-- Light rows only — not sitewide pageviews. Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS brain_game_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL DEFAULT 'hub',
  event TEXT NOT NULL CHECK (event IN ('hub_view', 'open', 'complete')),
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
  is_guest BOOLEAN NOT NULL DEFAULT TRUE,
  visitor_key TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_plays_game_event
  ON brain_game_plays (game_slug, event);
CREATE INDEX IF NOT EXISTS idx_brain_plays_created
  ON brain_game_plays (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_plays_source
  ON brain_game_plays (traffic_source);
CREATE INDEX IF NOT EXISTS idx_brain_plays_visitor
  ON brain_game_plays (visitor_key, game_slug, event);

ALTER TABLE brain_game_plays ENABLE ROW LEVEL SECURITY;

-- Reads/writes via service role from Next.js only
DROP POLICY IF EXISTS brain_game_plays_no_public ON brain_game_plays;
CREATE POLICY brain_game_plays_no_public ON brain_game_plays
  FOR ALL USING (false) WITH CHECK (false);

NOTIFY pgrst, 'reload schema';
