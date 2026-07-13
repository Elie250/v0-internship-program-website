# Hero videos (not stored in Git)

Large homepage videos are hosted on **Cloudflare R2** (or Supabase `platform-media/hero` as fallback).

## Upload

1. **Admin → Settings → Hero videos** — upload via the admin panel (direct to R2), or  
2. **CLI:** `pnpm run upload-hero-videos` (requires `R2_*` or Supabase env vars)

## Required filenames

- `e-learning.mp4`
- `transmission-line.mp4`
- `embedded-programming.mp4`
- `electronics.mov`

Set homepage background URL to `/videos/playlist` in admin settings.

See `scripts/43-r2-setup.md` for R2 configuration.
