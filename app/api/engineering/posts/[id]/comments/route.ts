import { NextResponse } from 'next/server'
import { addPostComment, loadPostComments } from '@/lib/engineering/profile-posts'
import { displayNameFromSession, getSessionUser } from '@/lib/auth/session-user'
import { authLinksFromReferer } from '@/lib/auth/public-auth-links'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RouteContext = { params: Promise<{ id: string }> }

async function resolvePublishedPost(postId: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  const { data } = await supabaseAdmin
    .from('engineer_profile_posts')
    .select('id')
    .eq('id', postId)
    .eq('status', 'published')
    .maybeSingle()
  return Boolean(data?.id)
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const exists = await resolvePublishedPost(id)
    if (!exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comments = await loadPostComments(id)
    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      const { loginUrl, registerUrl } = authLinksFromReferer(request, '/engineering/authors')
      return NextResponse.json(
        {
          error: 'Create an account or sign in to leave a comment',
          loginUrl,
          registerUrl,
        },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const exists = await resolvePublishedPost(id)
    if (!exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = await addPostComment({
      postId: id,
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
