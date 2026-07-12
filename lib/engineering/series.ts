export type EngineeringSeriesStatus = 'draft' | 'published' | 'archived'

export type EngineeringArticleSeries = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  status: EngineeringSeriesStatus
  sort_order: number
  created_at: string
  updated_at: string
  articleCount?: number
}

export function slugifySeriesTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `series-${Date.now()}`
}

export function normalizeEngineeringSeries(row: Record<string, unknown>): EngineeringArticleSeries {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    description: row.description != null ? String(row.description) : null,
    cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
    status: (row.status as EngineeringSeriesStatus) ?? 'published',
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    articleCount: row.article_count != null ? Number(row.article_count) : undefined,
  }
}

export function seriesPayloadFromBody(body: Record<string, unknown>) {
  const title = String(body.title ?? '').trim()
  return {
    title,
    slug: String(body.slug ?? '').trim() || slugifySeriesTitle(title),
    description: String(body.description ?? '').trim() || null,
    cover_image_url: String(body.cover_image_url ?? '').trim() || null,
    status: String(body.status ?? 'published'),
    sort_order: Number(body.sort_order ?? 0),
    updated_at: new Date().toISOString(),
  }
}
