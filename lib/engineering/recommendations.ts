import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { type ArticleAccessLevel } from '@/lib/engineering/article-access'
import {
  normalizeEngineeringArticle,
  type EngineeringArticlePublic,
} from '@/lib/engineering/articles'
import { applyAccessGateForLevel, loadPopularArticles, loadPublishedArticles } from '@/lib/engineering/queries'

async function loadRecentViewTags(userId: string, limit = 8): Promise<string[]> {
  if (!supabaseAdmin) return []

  const { data: views, error } = await supabaseAdmin
    .from('engineering_article_engagements')
    .select('article_id')
    .eq('user_id', userId)
    .eq('engagement_type', 'view')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (/engineering_article_engagements|could not find the table/i.test(error.message)) return []
    return []
  }

  const articleIds = (views ?? []).map((row) => String(row.article_id))
  if (articleIds.length === 0) return []

  const { data: articles } = await supabaseAdmin
    .from('engineering_articles')
    .select('tags')
    .in('id', articleIds)
    .eq('status', 'published')

  const tagCounts = new Map<string, number>()
  for (const row of articles ?? []) {
    const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
}

export async function loadRecommendedArticles(
  userId: string | null,
  options?: {
    excludeSlug?: string
    limit?: number
    accessLevel?: ArticleAccessLevel
  }
): Promise<EngineeringArticlePublic[]> {
  const limit = options?.limit ?? 6
  const accessLevel = options?.accessLevel ?? 'public'

  if (!userId || !supabaseAdmin) {
    return fallbackRecommendations(options?.excludeSlug, limit, accessLevel)
  }

  const recentTags = await loadRecentViewTags(userId, 10)
  if (recentTags.length === 0) {
    return fallbackRecommendations(options?.excludeSlug, limit, accessLevel)
  }

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('status', 'published')
    .overlaps('tags', recentTags)
    .order('published_at', { ascending: false })
    .limit(limit + 5)

  if (error) {
    return fallbackRecommendations(options?.excludeSlug, limit, accessLevel)
  }

  const articles = (data ?? [])
    .map((row) =>
      applyAccessGateForLevel(
        normalizeEngineeringArticle(row as Record<string, unknown>),
        accessLevel
      )
    )
    .filter((a) => a.slug !== options?.excludeSlug)
    .slice(0, limit)

  if (articles.length >= limit) return articles
  const fallback = await fallbackRecommendations(options?.excludeSlug, limit, accessLevel)
  return fillRecommendations(articles, options?.excludeSlug, limit, fallback)
}

async function fallbackRecommendations(
  excludeSlug: string | undefined,
  limit: number,
  accessLevel: ArticleAccessLevel
): Promise<EngineeringArticlePublic[]> {
  const popular = await loadPopularArticles(limit + 3)
  const filtered = popular.filter((a) => a.slug !== excludeSlug).slice(0, limit)
  if (filtered.length >= limit) return filtered

  const latest = await loadPublishedArticles({ limit: limit + 3, accessLevel })
  return fillRecommendations(filtered, excludeSlug, limit, latest)
}

function fillRecommendations(
  existing: EngineeringArticlePublic[],
  excludeSlug: string | undefined,
  limit: number,
  pool: EngineeringArticlePublic[]
): EngineeringArticlePublic[] {
  const seen = new Set(existing.map((a) => a.id))
  const merged = [...existing]
  for (const article of pool) {
    if (merged.length >= limit) break
    if (article.slug === excludeSlug || seen.has(article.id)) continue
    seen.add(article.id)
    merged.push(article)
  }

  return merged
}
