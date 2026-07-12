export type LibraryPillar = 'gallery' | 'books' | 'culture'

export type LibraryCultureType = 'inkuru' | 'ibisigo' | 'imivugo' | 'creative' | 'other'

export type LibraryItemStatus = 'draft' | 'pending_review' | 'published' | 'archived'

export type EnergyLibraryItem = {
  id: string
  title: string
  slug: string
  description: string | null
  pillar: LibraryPillar
  culture_type: LibraryCultureType | null
  body: string | null
  cover_image_url: string | null
  file_url: string | null
  gallery_images: string[]
  author_name: string | null
  language: string
  tags: string[]
  status: LibraryItemStatus
  uploaded_by: string | null
  uploader_role: string | null
  terms_accepted_at: string | null
  terms_version: string | null
  view_count: number
  sort_order: number
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export const LIBRARY_PILLARS: { id: LibraryPillar; label: string; description: string }[] = [
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Company photos, events, and visual archives from Energy & Logics.',
  },
  {
    id: 'books',
    label: 'Books',
    description: 'Guides, readers, and reference material to build your reading habit.',
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Inkuru, ibisigo, imivugo, and creative arts from students, lecturers, and our team.',
  },
]

export const LIBRARY_CULTURE_TYPES: { id: LibraryCultureType; label: string }[] = [
  { id: 'inkuru', label: 'Inkuru' },
  { id: 'ibisigo', label: 'Ibisigo' },
  { id: 'imivugo', label: 'Imivugo' },
  { id: 'creative', label: 'Creative arts' },
  { id: 'other', label: 'Other' },
]

export function slugifyLibraryTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `library-${Date.now()}`
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

export function normalizeLibraryItem(row: Record<string, unknown>): EnergyLibraryItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    description: row.description != null ? String(row.description) : null,
    pillar: (row.pillar as LibraryPillar) ?? 'gallery',
    culture_type: row.culture_type != null ? (row.culture_type as LibraryCultureType) : null,
    body: row.body != null ? String(row.body) : null,
    cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
    file_url: row.file_url != null ? String(row.file_url) : null,
    gallery_images: normalizeStringArray(row.gallery_images),
    author_name: row.author_name != null ? String(row.author_name) : null,
    language: String(row.language ?? 'rw'),
    tags: normalizeStringArray(row.tags),
    status: (row.status as LibraryItemStatus) ?? 'draft',
    uploaded_by: row.uploaded_by != null ? String(row.uploaded_by) : null,
    uploader_role: row.uploader_role != null ? String(row.uploader_role) : null,
    terms_accepted_at: row.terms_accepted_at != null ? String(row.terms_accepted_at) : null,
    terms_version: row.terms_version != null ? String(row.terms_version) : null,
    view_count: Number(row.view_count ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    is_featured: Boolean(row.is_featured),
    published_at: row.published_at != null ? String(row.published_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }
}

export function libraryItemPayloadFromBody(
  body: Record<string, unknown>,
  options?: {
    uploadedBy?: string | null
    uploaderRole?: string | null
    termsAccepted?: boolean
  }
) {
  const title = String(body.title ?? '').trim()
  const status = String(body.status ?? 'draft') as LibraryItemStatus
  const pillar = String(body.pillar ?? 'gallery') as LibraryPillar
  const cultureTypeRaw = String(body.culture_type ?? '').trim()
  const now = new Date().toISOString()

  const payload: Record<string, unknown> = {
    title,
    slug: String(body.slug ?? '').trim() || slugifyLibraryTitle(title),
    description: String(body.description ?? '').trim() || null,
    pillar,
    culture_type: pillar === 'culture' && cultureTypeRaw ? cultureTypeRaw : null,
    body: String(body.body ?? '').trim() || null,
    cover_image_url: String(body.cover_image_url ?? '').trim() || null,
    file_url: String(body.file_url ?? '').trim() || null,
    gallery_images: normalizeStringArray(body.gallery_images),
    author_name: String(body.author_name ?? '').trim() || null,
    language: String(body.language ?? 'rw').trim() || 'rw',
    tags: normalizeStringArray(body.tags),
    status,
    sort_order: Number(body.sort_order ?? 0),
    is_featured: Boolean(body.is_featured),
    updated_at: now,
  }

  if (status === 'published') {
    payload.published_at = body.published_at ?? now
  }

  if (options?.uploadedBy) {
    payload.uploaded_by = options.uploadedBy
  }
  if (options?.uploaderRole) {
    payload.uploader_role = options.uploaderRole
  }
  if (options?.termsAccepted) {
    payload.terms_accepted_at = now
    payload.terms_version = String(body.terms_version ?? '2026-01')
  }

  return payload
}

export function libraryItemCover(item: EnergyLibraryItem): string | null {
  if (item.cover_image_url) return item.cover_image_url
  if (item.gallery_images.length > 0) return item.gallery_images[0]
  return null
}

export function pillarLabel(pillar: LibraryPillar): string {
  return LIBRARY_PILLARS.find((entry) => entry.id === pillar)?.label ?? pillar
}

export function cultureTypeLabel(value: LibraryCultureType | null): string | null {
  if (!value) return null
  return LIBRARY_CULTURE_TYPES.find((entry) => entry.id === value)?.label ?? value
}

export function libraryStatusLabel(status: LibraryItemStatus): string {
  if (status === 'published') return 'Published'
  if (status === 'pending_review') return 'Pending review'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

export function libraryStatusBadgeClass(status: LibraryItemStatus): string {
  if (status === 'published') return 'bg-green-100 text-green-800'
  if (status === 'pending_review') return 'bg-blue-100 text-blue-900'
  if (status === 'archived') return 'bg-slate-100 text-slate-700'
  return 'bg-amber-100 text-amber-900'
}
