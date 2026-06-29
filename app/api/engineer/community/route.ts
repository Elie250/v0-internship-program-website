import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserSupportAccess } from '@/lib/support/subscription-access'

async function getSessionUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as {
      id: string
      email: string
      firstName?: string
      lastName?: string
      role: string
    }
  } catch {
    return null
  }
}

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('engineer_discussions')
    .select('*, author:users(id, first_name, last_name, email, role)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Log in to post in the community.' }, { status: 401 })
    }

    const access = await getUserSupportAccess(user.id)
    if (!access.hasActiveSubscription || !access.canPostCommunity) {
      return NextResponse.json(
        {
          error:
            access.planTier === 'free'
              ? 'Paid plans can start discussions. Free members can read and reply when enabled — upgrade to post.'
              : access.blockReason ?? 'Subscription required to post.',
          code: 'COMMUNITY_POST_DENIED',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const title = String(body.title ?? '').trim()
    const content = String(body.body ?? body.content ?? '').trim()
    const topic = String(body.topic ?? 'general').trim()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('engineer_discussions')
      .insert([{ user_id: user.id, title, body: content, topic }])
      .select('*, author:users(id, first_name, last_name, email, role)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[engineer/community]', error)
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 })
  }
}
