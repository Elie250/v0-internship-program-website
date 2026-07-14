-- Brain Training catalog: thumbnails + engineering game packs
-- Run in Supabase after scripts/62-brain-training-academy.sql

ALTER TABLE brain_games
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS estimated_minutes INT NOT NULL DEFAULT 4,
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

INSERT INTO brain_games (slug, name, description, category, difficulty_levels, sort_order, estimated_minutes, short_tagline)
VALUES
  (
    'color-word',
    'Color-Word Rush',
    'Stroop-style attention drill: decide whether the ink color matches the color word under time pressure.',
    'cognitive',
    4,
    10,
    4,
    'Ink vs word — stay sharp'
  ),
  (
    'sequence-match',
    'Sequence Spotter',
    'Compare two sequences of digits, letters, or mixed characters. Train visual memory and attention to detail.',
    'memory',
    4,
    20,
    4,
    'Catch the one different digit'
  ),
  (
    'ohm-law',
    'Ohm''s Law Arena',
    'True/false rapid rounds on V = I × R fundamentals for electrical technicians.',
    'electrical',
    4,
    30,
    5,
    'Voltage · Current · Resistance'
  ),
  (
    'circuit-symbols',
    'Circuit Symbol Match',
    'Identify electrical and electronic schematic symbols under a countdown.',
    'electronics',
    4,
    40,
    5,
    'Read the schematic language'
  ),
  (
    'logic-gates',
    'Logic Gate Scrimmage',
    'AND, OR, NOT, NAND and XOR truth-table decisions for digital / embedded basics.',
    'embedded',
    4,
    50,
    5,
    'Think in highs and lows'
  ),
  (
    'plc-ladder',
    'PLC Ladder Check',
    'Fundamental PLC ladder logic: contacts, coils, and energize conditions as YES/NO drills.',
    'plc',
    4,
    60,
    5,
    'Contacts & coils — field ready'
  ),
  (
    'code-trace',
    'Code Trace Sprint',
    'Trace tiny Python/C-style snippets and decide if the claimed output is correct.',
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
