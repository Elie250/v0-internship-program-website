import type { LibraryPillar } from '@/lib/library/items'

export function validateLibraryItemPayload(payload: Record<string, unknown>) {
  const title = String(payload.title ?? '').trim()
  const pillar = String(payload.pillar ?? '') as LibraryPillar

  if (!title) return 'Title is required'

  if (pillar === 'books' && !String(payload.file_url ?? '').trim()) {
    return 'Books require a PDF file'
  }

  if (pillar === 'gallery') {
    const images = Array.isArray(payload.gallery_images) ? payload.gallery_images : []
    const cover = String(payload.cover_image_url ?? '').trim()
    if (images.length === 0 && !cover) {
      return 'Gallery items require at least one image'
    }
  }

  if (pillar === 'culture') {
    const body = String(payload.body ?? '').trim()
    const file = String(payload.file_url ?? '').trim()
    if (!body && !file) {
      return 'Culture items require text content or a file'
    }
  }

  return null
}

export const LECTURER_LIBRARY_PILLARS: LibraryPillar[] = ['books', 'culture']

export const STUDENT_LIBRARY_PILLARS: LibraryPillar[] = ['culture']
