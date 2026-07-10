import {
  createSignedPutUrl,
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

export const COURSE_MATERIAL_MAX_BYTES = 25 * 1024 * 1024

export const COURSE_MATERIAL_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export function resolveCourseMaterialContentType(file: { name: string; type: string }): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mimeFromExt = ext ? EXTENSION_TO_MIME[ext] : undefined

  if (file.type && file.type !== 'application/octet-stream') {
    if (COURSE_MATERIAL_ALLOWED_TYPES.includes(file.type as (typeof COURSE_MATERIAL_ALLOWED_TYPES)[number])) {
      return file.type
    }
    if (mimeFromExt) return mimeFromExt
    return null
  }

  return mimeFromExt ?? null
}

export function validateCourseMaterialFile(file: {
  name: string
  type: string
  size: number
}): { ok: true; contentType: string } | { ok: false; error: string } {
  const contentType = resolveCourseMaterialContentType(file)

  if (!contentType) {
    return {
      ok: false,
      error: 'Upload PDF, image, video (MP4/WebM), Word, or PowerPoint files',
    }
  }

  if (file.size > COURSE_MATERIAL_MAX_BYTES) {
    return { ok: false, error: 'File must be under 25 MB' }
  }

  return { ok: true, contentType }
}

export function isStorageMimeTypeError(message: string): boolean {
  return /mime type|not supported|invalid.*type/i.test(message)
}

/** Direct-to-storage upload URL (browser PUT) — bypasses Vercel body size limits. */
export async function createCourseMaterialUploadTarget(
  courseId: string,
  file: { name: string; type: string; size: number }
): Promise<
  | { ok: true; signedUrl: string; path: string; publicUrl: string; contentType: string }
  | { ok: false; error: string; status: number }
> {
  if (!storageConfigured()) {
    return { ok: false, error: 'Storage not configured', status: 500 }
  }

  const validation = validateCourseMaterialFile(file)
  if (!validation.ok) {
    return { ok: false, error: validation.error, status: 400 }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `course-materials/${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const target = await createSignedPutUrl(path, validation.contentType)
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
    }
  }
}

export async function uploadCourseMaterialFile(
  courseId: string,
  file: File
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string; hint?: string }> {
  if (!storageConfigured()) {
    return { ok: false, error: 'Storage not configured', hint: storageConfigHint() }
  }

  const validation = validateCourseMaterialFile(file)
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `course-materials/${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await uploadObject(path, buffer, validation.contentType)
    return { ok: true, url: result.url, path: result.path }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return {
      ok: false,
      error: message,
      hint: isStorageMimeTypeError(message) ? storageConfigHint() : undefined,
    }
  }
}
