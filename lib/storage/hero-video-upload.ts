import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'
import {
  createSignedPutUrl,
  getMediaPublicBaseUrl,
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

export const HERO_VIDEO_MAX_BYTES = 500 * 1024 * 1024

const ALLOWED_NAMES: Map<string, string> = new Map(HERO_VIDEO_FILES.map((item) => [item.file, item.type]))

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
  if (!storageConfigured()) {
    return { ok: false, error: 'Storage not configured', status: 500, hint: storageConfigHint() }
  }

  const validation = validateHeroVideoFile(file)
  if (!validation.ok) {
    return { ok: false, error: validation.error, status: 400 }
  }

  try {
    const target = await createSignedPutUrl(validation.path, validation.contentType, 7200)
    return {
      ok: true,
      signedUrl: target.signedUrl,
      path: target.path,
      publicUrl: target.publicUrl,
      contentType: validation.contentType,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not create upload URL',
      status: 500,
      hint: storageConfigHint(),
    }
  }
}

export async function uploadHeroVideoFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const validation = validateHeroVideoFile({ name: fileName, size: buffer.length })
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }

  try {
    const result = await uploadObject(validation.path, buffer, contentType, { upsert: true })
    return { ok: true, url: result.url }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

export function getHeroVideosPublicBaseUrl(): string {
  const mediaBase = getMediaPublicBaseUrl()
  if (mediaBase) return `${mediaBase}/hero`

  const explicit = process.env.NEXT_PUBLIC_HERO_VIDEOS_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/platform-media/hero`
  }

  return '/videos'
}
