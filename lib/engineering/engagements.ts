import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeEngineeringArticle,
  type EngineeringArticlePublic,
} from '@/lib/engineering/articles'
import { applyAccessGateForLevel } from '@/lib/engineering/queries'
import type { ArticleAccessLevel } from '@/lib/engineering/article-access'

export type EngagementType = 'bookmark' | 'view'

const MISSING_TABLE = /engineering_article_engagements|could not find the table/i

async function loadArticlesByIds(
  articleIds: string[],
  accessLevel: ArticleAccessLevel
): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin || articleIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .in('id', articleIds)
    .eq('status', 'published')

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const byId = new Map(
    (data ?? []).map((row) => [
      String(row.id),
      applyAccessGateForLevel(
        normalizeEngineeringArticle(row as Record<string, unknown>),
        accessLevel
      ),
    ])
  )

  return articleIds.map((id) => byId.get(id)).filter(Boolean) as EngineeringArticlePublic[]
}

export async function recordUserArticleView(
  userId: string,
  articleId: string
): Promise<void> {
  if (!supabaseAdmin) return

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('engineering_article_engagements').upsert(
    {
      user_id: userId,
      article_id: articleId,
      engagement_type: 'view',
      updated_at: now,
    },
    { onConflict: 'user_id,article_id,engagement_type' }
  )

  if (error && !MISSING_TABLE.test(error.message)) {
    console.error('[engineering] recordUserArticleView:', error.message)
  }
}

export async function toggleArticleBookmark(
  userId: string,
  articleId: string
): Promise<{ bookmarked: boolean }> {
  if (!supabaseAdmin) return { bookmarked: false }

  const { data: existing } = await supabaseAdmin
    .from('engineering_article_engagements')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .eq('engagement_type', 'bookmark')
    .maybeSingle()

  if (existing?.id) {
    await supabaseAdmin.from('engineering_article_engagements').delete().eq('id', existing.id)
    return { bookmarked: false }
  }

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('engineering_article_engagements').insert([
    {
      user_id: userId,
      article_id: articleId,
      engagement_type: 'bookmark',
      created_at: now,
      updated_at: now,
    },
  ])

  if (error?.message && MISSING_TABLE.test(error.message)) {
    return { bookmarked: false }
  }
  if (error) throw error
  return { bookmarked: true }
}

export async function isArticleBookmarked(
  userId: string,
  articleId: string
): Promise<boolean> {
  if (!supabaseAdmin) return false

  const { data, error } = await supabaseAdmin
    .from('engineering_article_engagements')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .eq('engagement_type', 'bookmark')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return false
    return false
  }
  return Boolean(data?.id)
}

export async function loadBookmarkedArticles(
  userId: string,
  accessLevel: ArticleAccessLevel,
  limit = 24
): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_article_engagements')
    .select('article_id, updated_at')
    .eq('user_id', userId)
    .eq('engagement_type', 'bookmark')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const articleIds = (data ?? []).map((row) => String(row.article_id))
  return loadArticlesByIds(articleIds, accessLevel)
}

export async function loadReadingHistory(
  userId: string,
  accessLevel: ArticleAccessLevel,
  limit = 12
): Promise<EngineeringArticlePublic[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_article_engagements')
    .select('article_id, updated_at')
    .eq('user_id', userId)
    .eq('engagement_type', 'view')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  const articleIds = (data ?? []).map((row) => String(row.article_id))
  return loadArticlesByIds(articleIds, accessLevel)
}
