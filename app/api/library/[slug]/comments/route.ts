import { NextResponse } from 'next/server'
import { addLibraryComment, loadLibraryComments } from '@/lib/library/comments'
import { loadPublishedLibraryItemBySlug } from '@/lib/library/queries'
import { displayNameFromSession, getSessionUser } from '@/lib/auth/session-user'
import { authLinksFromReferer } from '@/lib/auth/public-auth-links'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const item = await loadPublishedLibraryItemBySlug(slug)
    if (!item || item.pillar !== 'culture') {
      return NextResponse.json({ error: 'Culture item not found' }, { status: 404 })
    }

    const comments = await loadLibraryComments(item.id)
    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      const { slug } = await context.params
      const { loginUrl, registerUrl } = authLinksFromReferer(request, `/library/${slug}`)
      return NextResponse.json(
        {
          error: 'Create an account or sign in to leave a comment',
          loginUrl,
          registerUrl,
        },
        { status: 401 }
      )
    }

    const { slug } = await context.params
    const item = await loadPublishedLibraryItemBySlug(slug)
    if (!item || item.pillar !== 'culture') {
      return NextResponse.json({ error: 'Culture item not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = await addLibraryComment({
      itemId: item.id,
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
