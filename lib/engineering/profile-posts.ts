import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type ProfilePost = {
  id: string
  authorId: string
  title: string | null
  body: string
  status: 'published' | 'hidden'
  createdAt: string
  updatedAt: string
}

export type PostComment = {
  id: string
  postId: string
  userId: string | null
  authorName: string
  body: string
  createdAt: string
}

function normalizePost(row: Record<string, unknown>): ProfilePost {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    title: row.title != null ? String(row.title) : null,
    body: String(row.body ?? ''),
    status: String(row.status ?? 'published') as ProfilePost['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function normalizePostComment(row: Record<string, unknown>): PostComment {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    authorName: String(row.author_name ?? 'Anonymous'),
    body: String(row.body ?? ''),
    createdAt: String(row.created_at),
  }
}

export async function loadPublicProfilePosts(authorId: string): Promise<ProfilePost[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineer_profile_posts')
    .select('id, author_id, title, body, status, created_at, updated_at')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error?.message?.includes('engineer_profile_posts')) return []
  return (data ?? []).map((row) => normalizePost(row as Record<string, unknown>))
}

export async function loadEngineerPosts(authorId: string): Promise<ProfilePost[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineer_profile_posts')
    .select('id, author_id, title, body, status, created_at, updated_at')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error?.message?.includes('engineer_profile_posts')) return []
  return (data ?? []).map((row) => normalizePost(row as Record<string, unknown>))
}

export async function createProfilePost(input: {
  authorId: string
  title?: string | null
  body: string
}): Promise<{ post?: ProfilePost; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const body = input.body.trim()
  if (!body) return { error: 'Post body cannot be empty' }
  if (body.length > 8000) return { error: 'Post is too long (max 8000 characters)' }

  const title = input.title?.trim() || null
  if (title && title.length > 200) return { error: 'Title is too long (max 200 characters)' }

  const { data, error } = await supabaseAdmin
    .from('engineer_profile_posts')
    .insert({
      author_id: input.authorId,
      title,
      body,
      status: 'published',
    })
    .select('id, author_id, title, body, status, created_at, updated_at')
    .single()

  if (error) return { error: error.message }
  return { post: normalizePost(data as Record<string, unknown>) }
}

export async function deleteProfilePost(
  postId: string,
  authorId: string
): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('engineer_profile_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId)

  if (error) return { error: error.message }
  return {}
}

export async function loadPostComments(postId: string): Promise<PostComment[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineer_post_comments')
    .select('id, post_id, user_id, author_name, body, created_at')
    .eq('post_id', postId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error?.message?.includes('engineer_post_comments')) return []
  return (data ?? []).map((row) => normalizePostComment(row as Record<string, unknown>))
}

export async function addPostComment(input: {
  postId: string
  userId: string | null
  authorName: string
  body: string
}): Promise<{ comment?: PostComment; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const body = input.body.trim()
  if (!body) return { error: 'Comment cannot be empty' }
  if (body.length > 4000) return { error: 'Comment is too long (max 4000 characters)' }

  const { data, error } = await supabaseAdmin
    .from('engineer_post_comments')
    .insert({
      post_id: input.postId,
      user_id: input.userId,
      author_name: input.authorName.trim() || 'Anonymous',
      body,
      status: 'visible',
    })
    .select('id, post_id, user_id, author_name, body, created_at')
    .single()

  if (error) return { error: error.message }
  return { comment: normalizePostComment(data as Record<string, unknown>) }
}
