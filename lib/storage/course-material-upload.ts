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

export function resolveCourseMaterialContentType(file: File): string | null {
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

export function validateCourseMaterialFile(file: File): { ok: true; contentType: string } | { ok: false; error: string } {
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
