import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { incrementArticleView, loadPublishedArticleBySlug } from '@/lib/engineering/queries'
import { recordUserArticleView } from '@/lib/engineering/engagements'

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  try {
    await incrementArticleView(slug)

    const user = await getSessionUser()
    if (user?.id) {
      const article = await loadPublishedArticleBySlug(slug, 'premium')
      if (article?.id) {
        await recordUserArticleView(user.id, article.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
