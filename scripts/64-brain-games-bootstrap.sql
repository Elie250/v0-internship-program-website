-- One-shot Brain Training bootstrap (safe to re-run).
-- Run in Supabase → SQL Editor. Prefer this over 62+63 if Admin still shows no games.
-- IMPORTANT: brain_games is created + seeded FIRST so a later FK error cannot block the catalog.

-- 1) Catalog table -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'cognitive',
  difficulty_levels INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brain_games
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE brain_games
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 100;

ALTER TABLE brain_games
  ADD COLUMN IF NOT EXISTS estimated_minutes INT NOT NULL DEFAULT 4;

ALTER TABLE brain_games
  ADD COLUMN IF NOT EXISTS short_tagline TEXT NOT NULL DEFAULT '';

ALTER TABLE brain_games DROP CONSTRAINT IF EXISTS brain_games_category_check;
ALTER TABLE brain_games ADD CONSTRAINT brain_games_category_check
  CHECK (category IN (
    'cognitive',
    'memory',
    'logic',
    'engineering',
    'electrical',
    'electronics',
    'embedded',
    'plc',
    'programming'
  ));

ALTER TABLE brain_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brain_games_public_read ON brain_games;
CREATE POLICY brain_games_public_read ON brain_games FOR SELECT USING (is_active = TRUE);

-- 2) Seed drills (do this before optional score tables) ------------------------------
INSERT INTO brain_games (slug, name, description, category, difficulty_levels, sort_order, estimated_minutes, short_tagline)
VALUES
  (
    'color-word',
    'Color-Word Rush',
    'Stroop attention drill: ink color vs color word.',
    'cognitive',
    4,
    10,
    4,
    'Ink vs word — stay sharp'
  ),
  (
    'sequence-match',
    'Sequence Spotter',
    'Compare two sequences and spot the difference.',
    'memory',
    4,
    20,
    4,
    'Catch the one different digit'
  ),
  (
    'ohm-law',
    'Ohm''s Law Arena',
    'True/false rounds on V = I × R fundamentals.',
    'electrical',
    4,
    30,
    5,
    'Voltage · Current · Resistance'
  ),
  (
    'circuit-symbols',
    'Circuit Symbol Match',
    'Identify electrical / electronic schematic symbols.',
    'electronics',
    4,
    40,
    5,
    'Read the schematic language'
  ),
  (
    'logic-gates',
    'Logic Gate Scrimmage',
    'AND, OR, NOT, NAND, XOR truth-table decisions.',
    'embedded',
    4,
    50,
    5,
    'Think in highs and lows'
  ),
  (
    'plc-ladder',
    'PLC Ladder Check',
    'Contacts, coils, and energize conditions as YES/NO drills.',
    'plc',
    4,
    60,
    5,
    'Contacts & coils — field ready'
  ),
  (
    'code-trace',
    'Code Trace Sprint',
    'Trace tiny snippets and judge the claimed output.',
    'programming',
    4,
    70,
    5,
    'Read code. Predict output.'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty_levels = EXCLUDED.difficulty_levels,
  sort_order = EXCLUDED.sort_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  short_tagline = EXCLUDED.short_tagline,
  is_active = TRUE;

-- 3) Optional scoring tables (UUID refs only — no hard FK to users) ------------------
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID NOT NULL REFERENCES brain_games(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  average_response_ms INT NOT NULL DEFAULT 0,
  time_taken_ms INT NOT NULL DEFAULT 0,
  level_completed INT NOT NULL DEFAULT 1,
  correct_count INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(game_id, score DESC);

CREATE TABLE IF NOT EXISTS brain_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  attention_score INT NOT NULL DEFAULT 0,
  memory_score INT NOT NULL DEFAULT 0,
  logic_score INT NOT NULL DEFAULT 0,
  speed_score INT NOT NULL DEFAULT 0,
  overall_score INT NOT NULL DEFAULT 0,
  total_sessions INT NOT NULL DEFAULT 0,
  total_xp INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brain_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_key)
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_achievements ENABLE ROW LEVEL SECURITY;

-- 4) Refresh PostgREST schema cache so the Next.js API can see the new table --------
NOTIFY pgrst, 'reload schema';

-- Quick check (should return 7):
-- SELECT slug, name, is_active FROM brain_games ORDER BY sort_order;
