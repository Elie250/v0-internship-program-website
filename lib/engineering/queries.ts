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
  type EngineeringArticleTier,
} from '@/lib/engineering/articles'
import { getUserSupportAccess } from '@/lib/support/subscription-access'

const MISSING_TABLE = /engineering_articles|could not find the table/i

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
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const accessLevel = options?.accessLevel ?? (await getReaderAccessLevel())
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

export function tierBadgeLabel(tier: EngineeringArticleTier): string {
  if (tier === 'free') return 'Free'
  if (tier === 'pro') return 'Pro'
  return 'Premium'
}
