import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type ArticleComment = {
  id: string
  articleId: string
  userId: string | null
  authorName: string
  body: string
  createdAt: string
}

function normalizeComment(row: Record<string, unknown>): ArticleComment {
  return {
    id: String(row.id),
    articleId: String(row.article_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    authorName: String(row.author_name ?? 'Anonymous'),
    body: String(row.body ?? ''),
    createdAt: String(row.created_at),
  }
}

export async function loadArticleComments(articleId: string): Promise<ArticleComment[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_article_comments')
    .select('id, article_id, user_id, author_name, body, created_at')
    .eq('article_id', articleId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error?.message?.includes('engineering_article_comments')) return []
  return (data ?? []).map((row) => normalizeComment(row as Record<string, unknown>))
}

export async function addArticleComment(input: {
  articleId: string
  userId: string | null
  authorName: string
  body: string
}): Promise<{ comment?: ArticleComment; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const body = input.body.trim()
  if (!body) return { error: 'Comment cannot be empty' }
  if (body.length > 4000) return { error: 'Comment is too long (max 4000 characters)' }

  const { data, error } = await supabaseAdmin
    .from('engineering_article_comments')
    .insert({
      article_id: input.articleId,
      user_id: input.userId,
      author_name: input.authorName.trim() || 'Anonymous',
      body,
      status: 'visible',
    })
    .select('id, article_id, user_id, author_name, body, created_at')
    .single()

  if (error) return { error: error.message }
  return { comment: normalizeComment(data as Record<string, unknown>) }
}
