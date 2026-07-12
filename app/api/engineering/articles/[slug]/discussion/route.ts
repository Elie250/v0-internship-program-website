import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { loadPublishedArticleBySlug } from '@/lib/engineering/queries'

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

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const article = await loadPublishedArticleBySlug(slug, 'premium')
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  const { data: discussion, error } = await supabaseAdmin
    .from('engineer_discussions')
    .select('id, title, body, reply_count, created_at, article_id')
    .eq('article_id', article.id)
    .maybeSingle()

  if (error?.message?.includes('article_id')) {
    return NextResponse.json({ discussion: null, replies: [] })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!discussion) return NextResponse.json({ discussion: null, replies: [] })

  const { data: replies } = await supabaseAdmin
    .from('engineer_discussion_replies')
    .select('id, body, created_at, author:users(id, first_name, last_name, email)')
    .eq('discussion_id', discussion.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return NextResponse.json({ discussion, replies: replies ?? [] })
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Log in to discuss this article.' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const access = await getUserSupportAccess(user.id)
  if (!access.hasActiveSubscription || !access.canPostCommunity) {
    return NextResponse.json(
      {
        error:
          access.planTier === 'free'
            ? 'Upgrade to a paid plan to start article discussions.'
            : access.blockReason ?? 'Subscription required.',
      },
      { status: 403 }
    )
  }

  const { slug } = await context.params
  const article = await loadPublishedArticleBySlug(slug, 'premium')
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  const existing = await supabaseAdmin
    .from('engineer_discussions')
    .select('id')
    .eq('article_id', article.id)
    .maybeSingle()

  if (existing.data?.id) {
    return NextResponse.json({ discussionId: existing.data.id, created: false })
  }

  const { data, error } = await supabaseAdmin
    .from('engineer_discussions')
    .insert([
      {
        user_id: user.id,
        article_id: article.id,
        title: `Discussion: ${article.title}`,
        body: `Share your questions and field experience about "${article.title}".`,
        topic: article.tags[0] ?? 'general',
      },
    ])
    .select('id')
    .single()

  if (error?.message?.includes('article_id')) {
    return NextResponse.json(
      { error: 'Run scripts/48-engineering-blog-phase2.sql to enable article discussions.' },
      { status: 500 }
    )
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ discussionId: data.id, created: true }, { status: 201 })
}
