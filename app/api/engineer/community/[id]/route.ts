import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserSupportAccess } from '@/lib/support/subscription-access'

async function getSessionUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as { id: string }
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: discussion, error: dErr } = await supabaseAdmin
    .from('engineer_discussions')
    .select('*, author:users(id, first_name, last_name, email, role)')
    .eq('id', id)
    .maybeSingle()

  if (dErr || !discussion) {
    return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
  }

  const { data: replies, error: rErr } = await supabaseAdmin
    .from('engineer_discussion_replies')
    .select('*, author:users(id, first_name, last_name, email, role)')
    .eq('discussion_id', id)
    .order('created_at', { ascending: true })

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  return NextResponse.json({ discussion, replies: replies ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Log in to reply.' }, { status: 401 })
    }

    const access = await getUserSupportAccess(user.id)
    if (!access.hasActiveSubscription) {
      return NextResponse.json({ error: 'Active subscription required.' }, { status: 403 })
    }

    if (!access.canReplyCommunity && !access.canPostCommunity) {
      return NextResponse.json(
        { error: 'Upgrade to a paid plan to participate in discussions.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const content = String(body.body ?? body.content ?? '').trim()
    if (!content) {
      return NextResponse.json({ error: 'Reply body is required.' }, { status: 400 })
    }

    const { data: discussion } = await supabaseAdmin
      .from('engineer_discussions')
      .select('id, reply_count')
      .eq('id', id)
      .maybeSingle()

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const { data: reply, error } = await supabaseAdmin
      .from('engineer_discussion_replies')
      .insert([{ discussion_id: id, user_id: user.id, body: content }])
      .select('*, author:users(id, first_name, last_name, email, role)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin
      .from('engineer_discussions')
      .update({
        reply_count: Number(discussion.reply_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    console.error('[engineer/community/replies]', error)
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 })
  }
}
