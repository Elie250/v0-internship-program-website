import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  articleLockReason,
  canReadFullArticle,
  resolveArticleAccessLevel,
  type ArticleAccessLevel,
} from '@/lib/engineering/article-access'
import {
  normalizeEngineeringArticle,
  type EngineeringArticle,
  type EngineeringArticlePublic,
} from '@/lib/engineering/articles'
import {
  normalizeEngineeringSeries,
  type EngineeringArticleSeries,
} from '@/lib/engineering/series'
import {
  normalizeLeadMagnet,
  type EngineeringLeadMagnet,
} from '@/lib/engineering/lead-magnets'
import { subscribeToEngineeringDigest } from '@/lib/engineering/digest-subscribers'
import { getUserSupportAccess } from '@/lib/support/subscription-access'

const MISSING_TABLE = /engineering_articles|engineering_article_series|engineering_lead_magnets|could not find the table/i

function applyAccessGate(
  article: EngineeringArticle,
  accessLevel: ArticleAccessLevel
): EngineeringArticlePublic {
  const canRead = canReadFullArticle(article.access_tier, accessLevel)
  if (canRead) {
    return { ...article, bodyLocked: false, lockReason: null }
  }
  return {
    ...article,
    body: article.excerpt || article.body.slice(0, 480),
    bodyLocked: true,
    lockReason: articleLockReason(article.access_tier),
  }
}

export { applyAccessGate as applyAccessGateForLevel }

export async function getReaderAccessLevel(): Promise<ArticleAccessLevel> {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw || !supabaseAdmin) return 'public'
  try {
    const session = JSON.parse(raw) as { id?: string }
    if (!session.id) return 'public'
    const access = await getUserSupportAccess(session.id)
    return resolveArticleAccessLevel(access)
  } catch {
    return 'public'
  }
}

export async function loadPublishedArticles(options?: {
  limit?: number
  tag?: string
  seriesId?: string
  featuredOnly?: boolean
  accessLevel?: ArticleAccessLevel
}): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin) return []

  let query = supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.featuredOnly) query = query.eq('is_featured', true)
  if (options?.tag) query = query.contains('tags', [options.tag])
  if (options?.seriesId) {
    query = query
      .eq('series_id', options.seriesId)
      .order('series_sort_order', { ascending: true })
  }
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    if (error.message.includes('series_id')) {
      const fallback = await supabaseAdmin
        .from('engineering_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(options?.limit ?? 48)
      const accessLevel = options?.accessLevel ?? (await getReaderAccessLevel())
      return (fallback.data ?? []).map((row) =>
        applyAccessGate(normalizeEngineeringArticle(row as Record<string, unknown>), accessLevel)
      )
    }
    throw error
  }

  const accessLevel = options?.accessLevel ?? (await getReaderAccessLevel())
  return (data ?? []).map((row) =>
    applyAccessGate(normalizeEngineeringArticle(row as Record<string, unknown>), accessLevel)
  )
}

export async function searchPublishedArticles(
  queryText: string,
  limit = 24
): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin || !queryText.trim()) return []

  const q = queryText.trim()
  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,body.ilike.%${q}%`)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const accessLevel = await getReaderAccessLevel()
  return (data ?? []).map((row) =>
    applyAccessGate(normalizeEngineeringArticle(row as Record<string, unknown>), accessLevel)
  )
}

export async function loadPopularArticles(limit = 5): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (MISSING_TABLE.test(error.message) || error.message.includes('view_count')) {
      return loadPublishedArticles({ limit })
    }
    throw error
  }

  const accessLevel = await getReaderAccessLevel()
  return (data ?? []).map((row) =>
    applyAccessGate(normalizeEngineeringArticle(row as Record<string, unknown>), accessLevel)
  )
}

export async function loadPublishedArticleBySlug(
  slug: string,
  accessLevel?: ArticleAccessLevel
): Promise<EngineeringArticlePublic | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }
  if (!data) return null

  const level = accessLevel ?? (await getReaderAccessLevel())
  return applyAccessGate(normalizeEngineeringArticle(data as Record<string, unknown>), level)
}

export async function incrementArticleView(slug: string): Promise<void> {
  if (!supabaseAdmin) return

  const { data } = await supabaseAdmin
    .from('engineering_articles')
    .select('id, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data?.id) return

  const nextCount = Number(data.view_count ?? 0) + 1
  await supabaseAdmin
    .from('engineering_articles')
    .update({ view_count: nextCount })
    .eq('id', data.id)
}

export async function loadPublishedSeries(): Promise<EngineeringArticleSeries[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_article_series')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const series = (data ?? []).map((row) =>
    normalizeEngineeringSeries(row as Record<string, unknown>)
  )

  const withCounts = await Promise.all(
    series.map(async (item) => {
      const { count } = await supabaseAdmin!
        .from('engineering_articles')
        .select('id', { count: 'exact', head: true })
        .eq('series_id', item.id)
        .eq('status', 'published')
      return { ...item, articleCount: count ?? 0 }
    })
  )

  return withCounts.filter((s) => (s.articleCount ?? 0) > 0)
}

export async function loadSeriesById(id: string): Promise<EngineeringArticleSeries | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('engineering_article_series')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }
  if (!data) return null
  return normalizeEngineeringSeries(data as Record<string, unknown>)
}

export async function loadSeriesBySlug(slug: string): Promise<EngineeringArticleSeries | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('engineering_article_series')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }
  if (!data) return null

  const series = normalizeEngineeringSeries(data as Record<string, unknown>)
  const { count } = await supabaseAdmin
    .from('engineering_articles')
    .select('id', { count: 'exact', head: true })
    .eq('series_id', series.id)
    .eq('status', 'published')

  return { ...series, articleCount: count ?? 0 }
}

export async function loadPublishedLeadMagnets(): Promise<EngineeringLeadMagnet[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_lead_magnets')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  return (data ?? []).map((row) => normalizeLeadMagnet(row as Record<string, unknown>))
}

export async function loadLeadMagnetBySlug(slug: string): Promise<EngineeringLeadMagnet | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('engineering_lead_magnets')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }
  if (!data) return null
  return normalizeLeadMagnet(data as Record<string, unknown>)
}

export async function recordLeadMagnetDownload(input: {
  slug: string
  email: string
  name?: string | null
}): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const email = input.email.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Enter a valid email address' }
  }

  const magnet = await loadLeadMagnetBySlug(input.slug)
  if (!magnet) return { success: false, error: 'Resource not found' }

  await supabaseAdmin.from('engineering_lead_downloads').insert([
    {
      lead_magnet_id: magnet.id,
      email,
      name: input.name?.trim() || null,
    },
  ])

  await supabaseAdmin
    .from('engineering_lead_magnets')
    .update({
      download_count: magnet.download_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', magnet.id)

  await subscribeToEngineeringDigest({
    email,
    name: input.name?.trim() || null,
  })

  return { success: true, fileUrl: magnet.file_url }
}

export async function loadArticleAnalytics(): Promise<
  Array<{ id: string; title: string; slug: string; view_count: number; status: string }>
> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('id, title, slug, view_count, status')
    .order('view_count', { ascending: false })
    .limit(20)

  if (error) {
    if (MISSING_TABLE.test(error.message) || error.message.includes('view_count')) return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    view_count: Number(row.view_count ?? 0),
    status: String(row.status),
  }))
}

export async function loadAllArticlesForAdmin(): Promise<EngineeringArticle[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }
  return (data ?? []).map((row) => normalizeEngineeringArticle(row as Record<string, unknown>))
}

export async function loadArticlesForAuthor(authorId: string): Promise<EngineeringArticle[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false })

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }
  return (data ?? []).map((row) => normalizeEngineeringArticle(row as Record<string, unknown>))
}

export async function loadArticlesForDigest(): Promise<EngineeringArticle[]> {
  if (!supabaseAdmin) return []
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .gte('published_at', weekAgo)
    .is('digest_sent_at', null)
    .order('published_at', { ascending: false })

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }
  return (data ?? []).map((row) => normalizeEngineeringArticle(row as Record<string, unknown>))
}

export async function publishScheduledArticles(): Promise<{ published: number }> {
  if (!supabaseAdmin) return { published: 0 }

  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('id, scheduled_publish_at')
    .eq('status', 'draft')
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now)

  if (error) {
    if (MISSING_TABLE.test(error.message) || error.message.includes('scheduled_publish_at')) {
      return { published: 0 }
    }
    throw error
  }

  if (!data?.length) return { published: 0 }

  for (const row of data) {
    const publishedAt = row.scheduled_publish_at
      ? String(row.scheduled_publish_at)
      : now
    await supabaseAdmin
      .from('engineering_articles')
      .update({
        status: 'published',
        published_at: publishedAt,
        scheduled_publish_at: null,
        updated_at: now,
      })
      .eq('id', row.id)
  }

  return { published: data.length }
}

export async function loadEditorialSummary(): Promise<{
  drafts: EngineeringArticle[]
  scheduled: EngineeringArticle[]
  recentPublished: EngineeringArticle[]
  activeSubscribers: number
}> {
  if (!supabaseAdmin) {
    return { drafts: [], scheduled: [], recentPublished: [], activeSubscribers: 0 }
  }

  const [draftsRes, scheduledRes, publishedRes, subCount] = await Promise.all([
    supabaseAdmin
      .from('engineering_articles')
      .select('*')
      .eq('status', 'draft')
      .is('scheduled_publish_at', null)
      .order('updated_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('engineering_articles')
      .select('*')
      .eq('status', 'draft')
      .not('scheduled_publish_at', 'is', null)
      .order('scheduled_publish_at', { ascending: true })
      .limit(8),
    supabaseAdmin
      .from('engineering_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('engineering_digest_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const normalize = (rows: Record<string, unknown>[] | null) =>
    (rows ?? []).map((row) => normalizeEngineeringArticle(row))

  if (scheduledRes.error?.message?.includes('scheduled_publish_at')) {
    return {
      drafts: normalize(draftsRes.data as Record<string, unknown>[] | null),
      scheduled: [],
      recentPublished: normalize(publishedRes.data as Record<string, unknown>[] | null),
      activeSubscribers: subCount.count ?? 0,
    }
  }

  return {
    drafts: normalize(draftsRes.data as Record<string, unknown>[] | null),
    scheduled: normalize(scheduledRes.data as Record<string, unknown>[] | null),
    recentPublished: normalize(publishedRes.data as Record<string, unknown>[] | null),
    activeSubscribers: subCount.count ?? 0,
  }
}
