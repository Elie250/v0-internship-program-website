import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'

export const HERO_VIDEO_MAX_BYTES = 500 * 1024 * 1024

const ALLOWED_NAMES = new Map(HERO_VIDEO_FILES.map((item) => [item.file, item.type]))

export function validateHeroVideoFile(file: {
  name: string
  size: number
}): { ok: true; contentType: string; path: string } | { ok: false; error: string } {
  if (!ALLOWED_NAMES.has(file.name)) {
    return { ok: false, error: 'Invalid hero video filename' }
  }

  if (file.size > HERO_VIDEO_MAX_BYTES) {
    return {
      ok: false,
      error: `File must be under ${Math.round(HERO_VIDEO_MAX_BYTES / 1024 / 1024)} MB`,
    }
  }

  if (file.size < 1000) {
    return { ok: false, error: 'File looks empty or corrupted (under 1 KB)' }
  }

  return {
    ok: true,
    contentType: ALLOWED_NAMES.get(file.name)!,
    path: `hero/${file.name}`,
  }
}

export async function createHeroVideoUploadTarget(file: {
  name: string
  size: number
}): Promise<
  | { ok: true; signedUrl: string; path: string; publicUrl: string; contentType: string }
  | { ok: false; error: string; status: number; hint?: string }
> {
  if (!supabaseAdmin) {
    return { ok: false, error: 'Database not configured', status: 500 }
  }

  const validation = validateHeroVideoFile(file)
  if (!validation.ok) {
    return { ok: false, error: validation.error, status: 400 }
  }

  const { data, error } = await supabaseAdmin.storage
    .from('platform-media')
    .createSignedUploadUrl(validation.path)

  if (error || !data?.signedUrl) {
    return {
      ok: false,
      error: error?.message ?? 'Could not create upload URL',
      status: 500,
      hint: 'Run scripts/34-hero-video-storage.sql and ensure the platform-media bucket exists.',
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const publicUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/platform-media/${validation.path}`
    : ''

  return {
    ok: true,
    signedUrl: data.signedUrl,
    path: validation.path,
    publicUrl,
    contentType: validation.contentType,
  }
}
