export type EngineeringArticleTier = 'free' | 'pro' | 'premium'
export type EngineeringArticleStatus = 'draft' | 'published' | 'archived'

export type EngineeringArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  cover_image_url: string | null
  author_id: string | null
  author_name: string | null
  tags: string[]
  access_tier: EngineeringArticleTier
  status: EngineeringArticleStatus
  is_featured: boolean
  series_id: string | null
  series_sort_order: number | null
  view_count: number
  published_at: string | null
  digest_sent_at: string | null
  created_at: string
  updated_at: string
}

export type EngineeringArticlePublic = EngineeringArticle & {
  bodyLocked: boolean
  lockReason: string | null
}

export const ENGINEERING_ARTICLE_TAGS = [
  'electrical',
  'plc',
  'embedded',
  'solar',
  'career',
  'tools',
  'field-fix',
] as const

export function slugifyArticleTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `article-${Date.now()}`
}

export function normalizeEngineeringArticle(row: Record<string, unknown>): EngineeringArticle {
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    excerpt: row.excerpt != null ? String(row.excerpt) : null,
    body: String(row.body ?? ''),
    cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
    author_id: row.author_id != null ? String(row.author_id) : null,
    author_name: row.author_name != null ? String(row.author_name) : null,
    tags,
    access_tier: (row.access_tier as EngineeringArticleTier) ?? 'free',
    status: (row.status as EngineeringArticleStatus) ?? 'draft',
    is_featured: Boolean(row.is_featured),
    series_id: row.series_id != null ? String(row.series_id) : null,
    series_sort_order: row.series_sort_order != null ? Number(row.series_sort_order) : null,
    view_count: Number(row.view_count ?? 0),
    published_at: row.published_at != null ? String(row.published_at) : null,
    digest_sent_at: row.digest_sent_at != null ? String(row.digest_sent_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }
}

export function articlePayloadFromBody(body: Record<string, unknown>, author?: { id: string; name: string }) {
  const status = String(body.status ?? 'draft') as EngineeringArticleStatus
  const title = String(body.title ?? '').trim()
  const payload: Record<string, unknown> = {
    title,
    slug: String(body.slug ?? '').trim() || slugifyArticleTitle(title),
    excerpt: String(body.excerpt ?? '').trim() || null,
    body: String(body.body ?? '').trim(),
    cover_image_url: String(body.cover_image_url ?? '').trim() || null,
    tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [],
    access_tier: (String(body.access_tier ?? 'free') as EngineeringArticleTier) || 'free',
    status,
    is_featured: Boolean(body.is_featured),
    updated_at: new Date().toISOString(),
  }

  if (body.series_id !== undefined) {
    payload.series_id = String(body.series_id ?? '').trim() || null
  }
  if (body.series_sort_order !== undefined) {
    const order = body.series_sort_order
    payload.series_sort_order =
      order === null || order === '' ? null : Number(order)
  }

  if (author) {
    payload.author_id = author.id
    payload.author_name = author.name
  }
  if (body.author_name !== undefined) {
    payload.author_name = String(body.author_name ?? '').trim() || null
  }

  if (status === 'published') {
    payload.published_at = body.published_at ?? new Date().toISOString()
  } else if (status === 'draft') {
    payload.published_at = null
  }

  return payload
}
