import { NextResponse } from 'next/server'
import {
  createProfilePost,
  deleteProfilePost,
  loadEngineerPosts,
} from '@/lib/engineering/profile-posts'
import { getSessionUser } from '@/lib/auth/session-user'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id || user.role !== 'engineer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await loadEngineerPosts(user.id)
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || user.role !== 'engineer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = await createProfilePost({
      authorId: user.id,
      title: body.title != null ? String(body.title) : null,
      body: String(body.body ?? ''),
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ post: result.post }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || user.role !== 'engineer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    if (!postId) {
      return NextResponse.json({ error: 'Post id required' }, { status: 400 })
    }

    const result = await deleteProfilePost(postId, user.id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
