-- Brain Training Academy (cognitive drills)
-- Run in Supabase SQL editor after prior numbered scripts.

CREATE TABLE IF NOT EXISTS brain_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'cognitive'
    CHECK (category IN ('cognitive', 'memory', 'logic', 'engineering')),
  difficulty_levels INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_game_sessions_attempt ON game_sessions(attempt_date DESC);

CREATE TABLE IF NOT EXISTS brain_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_brain_profiles_overall ON brain_profiles(overall_score DESC);

CREATE TABLE IF NOT EXISTS brain_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_brain_achievements_user ON brain_achievements(user_id);

ALTER TABLE brain_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_achievements ENABLE ROW LEVEL SECURITY;

-- Public read of game catalog; writes via service role (Next.js server)
DROP POLICY IF EXISTS brain_games_public_read ON brain_games;
CREATE POLICY brain_games_public_read ON brain_games FOR SELECT USING (is_active = TRUE);

INSERT INTO brain_games (slug, name, description, category, difficulty_levels)
VALUES
  (
    'color-word',
    'Color-Word Attention Challenge',
    'Stroop-style attention drill: decide whether the ink color matches the color word under time pressure.',
    'cognitive',
    4
  ),
  (
    'sequence-match',
    'Same / Different Sequence Test',
    'Compare two sequences of digits, letters, or mixed characters. Train visual memory and attention to detail.',
    'memory',
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty_levels = EXCLUDED.difficulty_levels,
  is_active = TRUE;
