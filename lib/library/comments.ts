import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type LibraryComment = {
  id: string
  itemId: string
  userId: string | null
  authorName: string
  body: string
  createdAt: string
}

function normalizeComment(row: Record<string, unknown>): LibraryComment {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    authorName: String(row.author_name ?? 'Anonymous'),
    body: String(row.body ?? ''),
    createdAt: String(row.created_at),
  }
}

export async function loadLibraryComments(itemId: string): Promise<LibraryComment[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('energy_library_comments')
    .select('id, item_id, user_id, author_name, body, created_at')
    .eq('item_id', itemId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error?.message?.includes('energy_library_comments')) return []
  return (data ?? []).map((row) => normalizeComment(row as Record<string, unknown>))
}

export async function addLibraryComment(input: {
  itemId: string
  userId: string | null
  authorName: string
  body: string
}): Promise<{ comment?: LibraryComment; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const body = input.body.trim()
  if (!body) return { error: 'Comment cannot be empty' }
  if (body.length > 4000) return { error: 'Comment is too long (max 4000 characters)' }

  const { data, error } = await supabaseAdmin
    .from('energy_library_comments')
    .insert({
      item_id: input.itemId,
      user_id: input.userId,
      author_name: input.authorName.trim() || 'Anonymous',
      body,
      status: 'visible',
    })
    .select('id, item_id, user_id, author_name, body, created_at')
    .single()

  if (error) return { error: error.message }
  return { comment: normalizeComment(data as Record<string, unknown>) }
}
