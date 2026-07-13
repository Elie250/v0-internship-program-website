/** Hero video file definitions (filename only — base URL resolved at runtime). */
export const HERO_VIDEO_FILES = [
  { file: 'e-learning.mp4', type: 'video/mp4', label: 'E-learning' },
  {
    file: 'transmission-line.mp4',
    type: 'video/mp4',
    label: 'Transmission line',
    /** Outdoor/sky footage — toned down so it matches other clips and crossfades cleanly. */
    tone: 'outdoor',
  },
  { file: 'embedded-programming.mp4', type: 'video/mp4', label: 'Embedded programming' },
  { file: 'electronics.mov', type: 'video/quicktime', label: 'Electronics' },
] as const

export type HeroVideoTone = 'outdoor'

export type HeroVideoSlide = {
  src: string
  type: string
  label: string
  tone?: HeroVideoTone
}

/** CSS filter per clip — keeps perceived brightness steadier across the playlist. */
export function heroVideoFilterForSlide(slide: HeroVideoSlide | undefined): string | undefined {
  if (!slide?.tone) return undefined
  if (slide.tone === 'outdoor') {
    return 'brightness(0.9) contrast(1.03) saturate(0.94)'
  }
  return undefined
}

/** Seconds each hero clip plays before rotating (highlights, not full file length). */
export const HERO_CLIP_SECONDS = 4

/** Resolve public URL base for hero videos (Cloudflare R2 CDN preferred). */
export function getHeroVideosBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_HERO_VIDEOS_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const r2Base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ||
    process.env.R2_PUBLIC_BASE_URL?.trim()
  if (r2Base) {
    return `${r2Base.replace(/\/$/, '')}/hero`
  }

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
    tone: 'tone' in item ? item.tone : undefined,
  }))
}
