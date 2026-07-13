# Hero videos (not stored in Git)

Large homepage videos are hosted on **Cloudflare R2** (or Supabase `platform-media/hero` as fallback).

## Upload

1. **Admin → Settings → Hero videos** — upload via the admin panel (direct to R2), or  
2. **CLI:** `pnpm run upload-hero-videos` (requires `R2_*` or Supabase env vars)

## Required filenames

- `e-learning.mp4`
- `transmission-line.mp4` — outdoor/sky shots; re-encode with fixed exposure if the clip still pulses mid-playback (`ffmpeg -vf eq=brightness=0.02:saturation=0.95`)
- `embedded-programming.mp4`
- `electronics.mov`

Set homepage background URL to `/videos/playlist` in admin settings.

See `scripts/43-r2-setup.md` for R2 configuration.
