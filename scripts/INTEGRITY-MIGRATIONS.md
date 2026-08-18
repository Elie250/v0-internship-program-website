# Recruitment & Academy integrity migrations

Run in Supabase SQL Editor **in order** (skip any already applied):

| Script | Purpose |
|--------|---------|
| `73-recruitment-screening-integrity.sql` | Talent integrity bands + reviews |
| `79-recruitment-integrity-decisions.sql` | Talent HM decision outcomes |
| `35-assessment-integrity.sql` | Academy attempts + events (base) |
| `80-academy-assessment-integrity-bands.sql` | Academy bands, reviews, thresholds |
| `81-academy-assessment-variants.sql` | STEM parameter variants per attempt |
| `82-academy-assessment-fullscreen.sql` | Optional fullscreen request policy |
| `83-recruitment-question-type-mix.sql` | Talent auto-select type mix (multiple / short / open %) |
| `84-recruitment-assessment-instructions.sql` | Candidate pre-instructions before starting an assessment |

**Rules (both products):** integrity is advisory — not a cheating verdict, does not auto-reject/void, and does not change scores.

## Implementation status

| Phase | Status |
|-------|--------|
| 0–3 Shared engine, schema, ingest, staff reports | Done |
| 4 Policy knobs + STEM variants | Done |
| 5 Soft student signals + migration fallbacks | Done |
| 6 Fullscreen + fingerprint + results badges | Done |
| 7 Hardening (void → rescore standings, admin void, fingerprint once, unit tests) | Done |
| 8 Bugfix (fullscreen exit-only counting, void unlock, quiz column fallbacks) | Done |

**Planned phases remaining:** none (webcam / AI coupling stay out of scope).

## Local checks

```bash
pnpm test:integrity
pnpm exec tsc --noEmit
```

Self-check: `scripts/integrity-selfcheck.mjs` (offline, no extra deps).
