import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { sendSupportTicketCreatedToAdmin } from '@/lib/email/notifications'

type SessionUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as SessionUser
  } catch {
    return null
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*, category:support_categories(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json(
        { error: 'Log in to submit a support request.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const access = await getUserSupportAccess(sessionUser.id)
    if (!access.canSubmitTicket || !access.subscription) {
      return NextResponse.json(
        { error: access.blockReason ?? 'Active subscription required', code: 'NO_SUBSCRIPTION' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim()
    const categoryId = body.category_id ? String(body.category_id) : null
    const priority = String(body.priority ?? 'normal')
    const phone = String(body.requester_phone ?? access.subscription.applicant_phone ?? '').trim()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const requesterName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim()

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([
        {
          user_id: sessionUser.id,
          subscription_id: access.subscription.id,
          title,
          description,
          category_id: categoryId,
          priority,
          requester_name: requesterName || sessionUser.email,
          requester_email: sessionUser.email,
          requester_phone: phone || null,
          status: 'open',
        },
      ])
      .select('*, category:support_categories(name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('support_subscriptions')
      .update({
        tickets_used: access.subscription.tickets_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', access.subscription.id)

    void sendSupportTicketCreatedToAdmin({
      title,
      requesterName: requesterName || sessionUser.email,
      requesterEmail: sessionUser.email,
      priority,
      description,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[support-tickets]', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
