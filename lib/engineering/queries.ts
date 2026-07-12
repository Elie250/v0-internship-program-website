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

  await supabaseAdmin.from('engineering_digest_subscribers').upsert(
    {
      email,
      name: input.name?.trim() || null,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: 'email' }
  )

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
