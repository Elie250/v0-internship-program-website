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

const AUTHOR_SELECT_MINIMAL = 'id, first_name, last_name, role'

type AuthorUserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
  profile_title?: string | null
  profile_bio?: string | null
  profile_photo_url?: string | null
  profile_education?: string | null
  profile_experience?: string | null
  profile_qualifications?: string | null
  profile_cv_url?: string | null
}

async function loadAuthorUserRow(authorId: string): Promise<AuthorUserRow | null> {
  if (!supabaseAdmin) return null

  const attempts = [
    AUTHOR_SELECT,
    'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url',
    AUTHOR_SELECT_MINIMAL,
  ]

  for (const select of attempts) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(select)
      .eq('id', authorId)
      .maybeSingle()

    if (!error && data) {
      return data as unknown as AuthorUserRow
    }
  }

  return null
}

export async function loadPublicAuthorProfile(authorId: string): Promise<PublicAuthorProfile | null> {
  if (!supabaseAdmin) return null

  const user = await loadAuthorUserRow(authorId)
  if (!user) return null

  const [{ data: articles }, posts] = await Promise.all([
    supabaseAdmin
      .from('engineering_articles')
      .select('*')
      .eq('author_id', authorId)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    loadPublicProfilePosts(authorId),
  ])

  const published = (articles ?? []).map((row) =>
    normalizeEngineeringArticle(row as Record<string, unknown>)
  )

  const row = user as Record<string, unknown>
  const hasProfileContent = Boolean(
    user.profile_title ||
      user.profile_bio ||
      user.profile_photo_url ||
      row.profile_education ||
      row.profile_experience ||
      row.profile_qualifications ||
      row.profile_cv_url
  )

  if (published.length === 0 && posts.length === 0 && !hasProfileContent) return null

  const firstName = String(user.first_name ?? '')
  const lastName = String(user.last_name ?? '')

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

export async function listPublishedAuthors(): Promise<
  Array<{ id: string; name: string; articleCount: number; postCount: number }>
> {
  if (!supabaseAdmin) return []

  const authors = new Map<string, { name: string; articleCount: number; postCount: number }>()

  const { data: articleRows, error: articlesError } = await supabaseAdmin
    .from('engineering_articles')
    .select('author_id, author_name')
    .eq('status', 'published')
    .not('author_id', 'is', null)

  if (!articlesError?.message?.includes('engineering_articles')) {
    for (const row of articleRows ?? []) {
      const id = String(row.author_id)
      const existing = authors.get(id)
      authors.set(id, {
        name: existing?.name || String(row.author_name ?? 'Author'),
        articleCount: (existing?.articleCount ?? 0) + 1,
        postCount: existing?.postCount ?? 0,
      })
    }
  }

  const { data: postRows, error: postsError } = await supabaseAdmin
    .from('engineer_profile_posts')
    .select('author_id')
    .eq('status', 'published')

  if (!postsError?.message?.includes('engineer_profile_posts')) {
    for (const row of postRows ?? []) {
      const id = String(row.author_id)
      const existing = authors.get(id)
      authors.set(id, {
        name: existing?.name || 'Author',
        articleCount: existing?.articleCount ?? 0,
        postCount: (existing?.postCount ?? 0) + 1,
      })
    }
  }

  const missingNameIds = [...authors.entries()]
    .filter(([, value]) => value.name === 'Author')
    .map(([id]) => id)

  if (missingNameIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .in('id', missingNameIds)

    for (const user of users ?? []) {
      const id = String(user.id)
      const entry = authors.get(id)
      if (!entry) continue
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
      if (name) entry.name = name
    }
  }

  return [...authors.entries()]
    .map(([id, value]) => ({
      id,
      name: value.name,
      articleCount: value.articleCount,
      postCount: value.postCount,
    }))
    .sort((a, b) => b.articleCount + b.postCount - (a.articleCount + a.postCount))
}
