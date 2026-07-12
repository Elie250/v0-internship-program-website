import { NextResponse } from 'next/server'
import { addArticleComment, loadArticleComments } from '@/lib/engineering/comments'
import { displayNameFromSession, getSessionUser } from '@/lib/auth/session-user'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RouteContext = { params: Promise<{ slug: string }> }

async function resolveArticleId(slug: string): Promise<string | null> {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('engineering_articles')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data?.id ? String(data.id) : null
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const articleId = await resolveArticleId(slug)
    if (!articleId) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const comments = await loadArticleComments(articleId)
    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Sign in to leave a comment', loginUrl: '/login' },
        { status: 401 }
      )
    }

    const { slug } = await context.params
    const articleId = await resolveArticleId(slug)
    if (!articleId) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = await addArticleComment({
      articleId,
      userId: user.id,
      authorName: displayNameFromSession(user),
      body: String(body.body ?? ''),
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ comment: result.comment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
