# Migrate Supabase Storage → Cloudflare R2

Move existing `platform-media` files off Supabase and point the database at your R2 CDN.

## Prerequisites

- R2 bucket `platform-media` with custom domain (e.g. `https://media.energyandlogics.com`)
- R2 CORS configured (`scripts/43-r2-cors.json`)
- Vercel env vars set for R2 (new uploads already go to R2)
- Local `.env.local` with **both** Supabase and R2 credentials

## Option A — Node script (recommended)

From project root:

```bash
# 1. Preview files and URL changes (no writes)
node scripts/migrate-supabase-to-r2.mjs --dry-run --rewrite-urls

# 2. Copy files to R2 (skips objects already on R2)
node scripts/migrate-supabase-to-r2.mjs

# 3. Rewrite database URLs
node scripts/migrate-supabase-to-r2.mjs --rewrite-urls

# Or steps 2+3 in one command:
node scripts/migrate-supabase-to-r2.mjs --rewrite-urls
```

Flags:

| Flag | Effect |
|------|--------|
| `--dry-run` | List actions only |
| `--rewrite-urls` | Update DB URLs after copy |
| `--urls-only` | Skip file copy; only rewrite DB URLs |
| `--force` | Overwrite objects already on R2 |

npm shortcut:

```bash
pnpm migrate-storage-to-r2 -- --dry-run --rewrite-urls
```

## Option B — SQL only (URLs)

If files were copied manually (e.g. via Cloudflare dashboard or `rclone`):

1. Edit `r2_base` at the top of `scripts/44-migrate-storage-urls-to-r2.sql`
2. Run the script in Supabase SQL Editor
3. Check the audit query at the bottom (`remaining` should be `0`)

## What gets migrated

**Storage paths** (same keys on R2):

- `hero/` — hero videos and images
- `products/`, `services/`, `announcements/`, `courses/`, `brand/`
- `receipts/`, `course-materials/{courseId}/`, `lab-submissions/{courseId}/{userId}/`

**Database columns updated:**

- `products.images`, `services.image_url`, `announcements.image_url`
- `courses.thumbnail`, `course_content.content_url`, `payments.receipt_url`
- `site_settings` (`company_logo_url`, `hero_videos_base_url`)
- `site_hero.background_image`, `users.profile_photo_url`, `lab_submissions.file_url`
- `course_sessions.recording_url`, `course_sessions.session_materials`
- `webinars.recording_url`, and other URL columns when present

**Skipped automatically:**

- Local paths (`/images/…`, `/videos/playlist`)
- URLs that are not Supabase `platform-media` links

**Hero playlist:** No DB change needed — runtime uses `NEXT_PUBLIC_R2_PUBLIC_BASE_URL/hero` when set.

## Verify

1. Open a product image URL in the browser → `https://media.energyandlogics.com/...`
2. Student receipt / course material links load from R2
3. Supabase dashboard → Storage egress drops over the next billing cycle
4. Run audit query in `44-migrate-storage-urls-to-r2.sql` → all counts `0`

## After migration

- Keep Supabase Storage bucket for a few weeks as backup, then delete objects when confident
- Old Supabase URLs in emails/PDFs outside the DB will still point to Supabase until resent
