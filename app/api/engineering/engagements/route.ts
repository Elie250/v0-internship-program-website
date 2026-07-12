import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { resolveArticleAccessLevel } from '@/lib/engineering/article-access'
import {
  isArticleBookmarked,
  loadBookmarkedArticles,
  loadReadingHistory,
  toggleArticleBookmark,
} from '@/lib/engineering/engagements'
import { loadRecommendedArticles } from '@/lib/engineering/recommendations'

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Log in to view saved articles.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section') ?? 'bookmarks'
  const excludeSlug = searchParams.get('excludeSlug') ?? undefined

  const access = await getUserSupportAccess(user.id)
  const accessLevel = resolveArticleAccessLevel(access)

  try {
    if (section === 'history') {
      const articles = await loadReadingHistory(user.id, accessLevel, 12)
      return NextResponse.json({ articles })
    }
    if (section === 'recommendations') {
      const articles = await loadRecommendedArticles(user.id, {
        excludeSlug,
        limit: 6,
        accessLevel,
      })
      return NextResponse.json({ articles })
    }

    const articles = await loadBookmarkedArticles(user.id, accessLevel, 24)
    return NextResponse.json({ articles })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load engagements'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Log in to save articles.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const articleId = String(body.articleId ?? '').trim()
    const action = String(body.action ?? 'bookmark')

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }
    if (action !== 'bookmark' && action !== 'unbookmark') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'unbookmark') {
      const bookmarked = await isArticleBookmarked(user.id, articleId)
      if (bookmarked) await toggleArticleBookmark(user.id, articleId)
      return NextResponse.json({ bookmarked: false })
    }

    const already = await isArticleBookmarked(user.id, articleId)
    if (!already) {
      await toggleArticleBookmark(user.id, articleId)
    }
    return NextResponse.json({ bookmarked: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update bookmark'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
