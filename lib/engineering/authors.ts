import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { normalizeEngineeringArticle, type EngineeringArticle } from '@/lib/engineering/articles'
import { loadPublicProfilePosts, type ProfilePost } from '@/lib/engineering/profile-posts'

export type PublicAuthorProfile = {
  id: string
  name: string
  role: string
  title: string | null
  bio: string | null
  photoUrl: string | null
  education: string | null
  experience: string | null
  qualifications: string | null
  cvUrl: string | null
  articles: EngineeringArticle[]
  posts: ProfilePost[]
}

const AUTHOR_SELECT =
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, profile_education, profile_experience, profile_qualifications, profile_cv_url'

export async function loadPublicAuthorProfile(authorId: string): Promise<PublicAuthorProfile | null> {
  if (!supabaseAdmin) return null

  let { data: user, error } = await supabaseAdmin
    .from('users')
    .select(AUTHOR_SELECT)
    .eq('id', authorId)
    .maybeSingle()

  if (error?.message?.includes('profile_')) {
    const fallback = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url')
      .eq('id', authorId)
      .maybeSingle()
    if (fallback.error || !fallback.data) return null
    user = {
      ...fallback.data,
      profile_education: null,
      profile_experience: null,
      profile_qualifications: null,
      profile_cv_url: null,
    }
    error = null
  }

  if (error || !user) return null

  const { data: articles } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const published = (articles ?? []).map((row) =>
    normalizeEngineeringArticle(row as Record<string, unknown>)
  )
  const posts = await loadPublicProfilePosts(authorId)
  if (published.length === 0 && posts.length === 0) return null

  const firstName = String(user.first_name ?? '')
  const lastName = String(user.last_name ?? '')
  const row = user as Record<string, unknown>

  return {
    id: String(user.id),
    name: [firstName, lastName].filter(Boolean).join(' ') || 'Author',
    role: String(user.role ?? ''),
    title: user.profile_title ? String(user.profile_title) : null,
    bio: user.profile_bio ? String(user.profile_bio) : null,
    photoUrl: user.profile_photo_url ? String(user.profile_photo_url) : null,
    education: row.profile_education ? String(row.profile_education) : null,
    experience: row.profile_experience ? String(row.profile_experience) : null,
    qualifications: row.profile_qualifications ? String(row.profile_qualifications) : null,
    cvUrl: row.profile_cv_url ? String(row.profile_cv_url) : null,
    articles: published,
    posts,
  }
}

export async function listPublishedAuthors(): Promise<Array<{ id: string; name: string; articleCount: number }>> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('author_id, author_name')
    .eq('status', 'published')
    .not('author_id', 'is', null)

  if (error?.message?.includes('engineering_articles')) return []

  const counts = new Map<string, { name: string; count: number }>()
  for (const row of data ?? []) {
    const id = String(row.author_id)
    const existing = counts.get(id)
    counts.set(id, {
      name: existing?.name || String(row.author_name ?? 'Author'),
      count: (existing?.count ?? 0) + 1,
    })
  }

  return [...counts.entries()]
    .map(([id, value]) => ({ id, name: value.name, articleCount: value.count }))
    .sort((a, b) => b.articleCount - a.articleCount)
}
