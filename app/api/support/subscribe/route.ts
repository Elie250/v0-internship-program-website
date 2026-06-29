import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { SUPPORT_SUBSCRIBER_ROLES } from '@/lib/support/types'
import { getUserSupportAccess } from '@/lib/support/subscription-access'

type SessionUser = {
  id: string
  email: string
  role: string
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

  const access = await getUserSupportAccess(user.id)
  return NextResponse.json(access)
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json(
        { error: 'Log in to subscribe to engineering support.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    if (!SUPPORT_SUBSCRIBER_ROLES.includes(sessionUser.role as (typeof SUPPORT_SUBSCRIBER_ROLES)[number])) {
      return NextResponse.json(
        {
          error: 'Engineering support subscriptions are for Engineer, Student, or Registered accounts.',
          code: 'WRONG_ROLE',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const planId = String(body.planId ?? '').trim()
    const applicantPhone = String(body.applicantPhone ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    if (!planId || !applicantPhone) {
      return NextResponse.json({ error: 'Plan and phone number are required' }, { status: 400 })
    }

    const access = await getUserSupportAccess(sessionUser.id)
    if (access.hasActiveSubscription) {
      return NextResponse.json(
        { error: 'You already have an active support subscription.' },
        { status: 409 }
      )
    }
    if (access.subscription?.status === 'payment_pending_review') {
      return NextResponse.json(
        { error: 'You already have a subscription awaiting payment verification.' },
        { status: 409 }
      )
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('support_subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('status', 'published')
      .maybeSingle()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Support plan not found' }, { status: 404 })
    }

    const amountDue = Number(plan.price ?? 0)
    const isFree = amountDue <= 0

    if (!isFree && !receiptUrl) {
      return NextResponse.json(
        { error: 'Upload your MoMo payment receipt before subscribing' },
        { status: 400 }
      )
    }

    const payerName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim()

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('support_subscriptions')
      .insert([
        {
          user_id: sessionUser.id,
          plan_id: planId,
          status: isFree ? 'active' : 'payment_pending_review',
          applicant_phone: applicantPhone,
          starts_at: isFree ? new Date().toISOString() : null,
          ends_at: isFree
            ? new Date(Date.now() + Number(plan.duration_days ?? 30) * 86400000).toISOString()
            : null,
        },
      ])
      .select('id')
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: subError?.message ?? 'Failed to create subscription' }, { status: 500 })
    }

    if (isFree) {
      return NextResponse.json({
        subscriptionId: subscription.id,
        status: 'active',
        message: 'Your support plan is active. You can submit help requests now.',
      })
    }

    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: amountDue,
          payer_name: payerName || sessionUser.email,
          payer_email: sessionUser.email,
          payer_phone: applicantPhone,
          payment_method: 'MTN MoMo',
          receipt_url: receiptUrl,
          receipt_number: receiptNumber || null,
          support_subscription_id: subscription.id,
          student_id: sessionUser.id,
          status: 'pending_review',
        },
      ])
      .select('id')
      .single()

    if (payError || !payment) {
      await supabaseAdmin.from('support_subscriptions').delete().eq('id', subscription.id)
      return NextResponse.json({ error: payError?.message ?? 'Failed to record payment' }, { status: 500 })
    }

    await supabaseAdmin
      .from('support_subscriptions')
      .update({ payment_id: payment.id, updated_at: new Date().toISOString() })
      .eq('id', subscription.id)

    return NextResponse.json({
      subscriptionId: subscription.id,
      paymentId: payment.id,
      status: 'payment_pending_review',
      message: 'Receipt submitted. An admin will verify your payment and activate your plan.',
    })
  } catch (error) {
    console.error('[support/subscribe]', error)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
