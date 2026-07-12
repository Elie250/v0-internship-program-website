import { NextResponse } from 'next/server'
import { loadPublicAuthorProfile } from '@/lib/engineering/authors'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const author = await loadPublicAuthorProfile(id)
    if (!author) {
      return NextResponse.json({ available: false }, { status: 404 })
    }

    return NextResponse.json({
      available: true,
      id: author.id,
      name: author.name,
      articleCount: author.articles.length,
      postCount: author.posts.length,
    })
  } catch {
    return NextResponse.json({ available: false }, { status: 500 })
  }
}
