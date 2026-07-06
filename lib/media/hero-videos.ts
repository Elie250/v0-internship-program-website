/** Hero video file definitions (filename only — base URL resolved at runtime). */
export const HERO_VIDEO_FILES = [
  { file: 'e-learning.mp4', type: 'video/mp4', label: 'E-learning' },
  { file: 'transmission-line.mp4', type: 'video/mp4', label: 'Transmission line' },
  { file: 'embedded-programming.mp4', type: 'video/mp4', label: 'Embedded programming' },
  { file: 'electronics.mov', type: 'video/quicktime', label: 'Electronics' },
] as const

export type HeroVideoSlide = {
  src: string
  type: string
  label: string
}

/** Seconds each hero clip plays before rotating (highlights, not full file length). */
export const HERO_CLIP_SECONDS = 4

/** Resolve public URL base for hero videos (Supabase CDN preferred on Vercel). */
export function getHeroVideosBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_HERO_VIDEOS_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/platform-media/hero`
  }

  return '/videos'
}

export function getHeroVideoPlaylist(): HeroVideoSlide[] {
  const base = getHeroVideosBaseUrl()
  return HERO_VIDEO_FILES.map((item) => ({
    src: `${base}/${item.file}`,
    type: item.type,
    label: item.label,
  }))
}
