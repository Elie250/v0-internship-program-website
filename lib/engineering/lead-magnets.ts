export type LeadMagnetStatus = 'draft' | 'published' | 'archived'

export type EngineeringLeadMagnet = {
  id: string
  title: string
  slug: string
  description: string | null
  file_url: string
  status: LeadMagnetStatus
  download_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

export function slugifyLeadMagnetTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `guide-${Date.now()}`
}

export function normalizeLeadMagnet(row: Record<string, unknown>): EngineeringLeadMagnet {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    description: row.description != null ? String(row.description) : null,
    file_url: String(row.file_url ?? ''),
    status: (row.status as LeadMagnetStatus) ?? 'published',
    download_count: Number(row.download_count ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }
}

export function leadMagnetPayloadFromBody(body: Record<string, unknown>) {
  const title = String(body.title ?? '').trim()
  return {
    title,
    slug: String(body.slug ?? '').trim() || slugifyLeadMagnetTitle(title),
    description: String(body.description ?? '').trim() || null,
    file_url: String(body.file_url ?? '').trim(),
    status: String(body.status ?? 'published'),
    sort_order: Number(body.sort_order ?? 0),
    updated_at: new Date().toISOString(),
  }
}
