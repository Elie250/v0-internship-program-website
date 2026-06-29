import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type EngineerSubscriptionApplication = {
  subscriptionId: string
  status: string
  subscriberName: string
  subscriberEmail: string
  subscriberPhone: string | null
  createdAt: string
  plan: {
    id: string
    name: string
    price: number
    durationDays: number
  } | null
  payment: {
    id: string
    amount: number
    status: string
    receiptUrl: string | null
    receiptNumber: string | null
    createdAt: string
  } | null
}

export async function queryEngineerSubscriptionApplications(
  filter: 'pending' | 'history' | 'all' = 'pending'
): Promise<{ rows: EngineerSubscriptionApplication[]; error?: string }> {
  if (!supabaseAdmin) return { rows: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('support_subscriptions')
    .select(
      'id, status, applicant_phone, created_at, plan_id, user:users(first_name, last_name, email)'
    )
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.eq('status', 'payment_pending_review')
  } else if (filter === 'history') {
    query = query.in('status', ['active', 'cancelled', 'refunded', 'expired'])
  }

  const { data: subs, error } = await query.limit(200)
  if (error) return { rows: [], error: error.message }

  const planIds = [...new Set((subs ?? []).map((s) => s.plan_id).filter(Boolean))]
  const subIds = (subs ?? []).map((s) => s.id)

  let plansById = new Map<string, EngineerSubscriptionApplication['plan']>()
  if (planIds.length) {
    const { data: plans } = await supabaseAdmin
      .from('support_subscription_plans')
      .select('id, name, price, duration_days')
      .in('id', planIds)
    plansById = new Map(
      (plans ?? []).map((p) => [
        p.id,
        {
          id: p.id,
          name: p.name,
          price: Number(p.price ?? 0),
          durationDays: Number(p.duration_days ?? 0),
        },
      ])
    )
  }

  let paymentsBySub = new Map<string, EngineerSubscriptionApplication['payment']>()
  if (subIds.length) {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('id, amount, status, receipt_url, receipt_number, created_at, support_subscription_id')
      .in('support_subscription_id', subIds)
      .order('created_at', { ascending: false })

    for (const p of payments ?? []) {
      if (!p.support_subscription_id || paymentsBySub.has(p.support_subscription_id)) continue
      paymentsBySub.set(p.support_subscription_id, {
        id: p.id,
        amount: Number(p.amount ?? 0),
        status: p.status,
        receiptUrl: p.receipt_url,
        receiptNumber: p.receipt_number,
        createdAt: p.created_at,
      })
    }
  }

  const rows: EngineerSubscriptionApplication[] = (subs ?? []).map((s) => {
    const user = s.user as { first_name?: string; last_name?: string; email?: string } | null
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
    return {
      subscriptionId: s.id,
      status: s.status,
      subscriberName: name || user?.email || 'Engineer',
      subscriberEmail: user?.email ?? '',
      subscriberPhone: s.applicant_phone,
      createdAt: s.created_at,
      plan: s.plan_id ? plansById.get(s.plan_id) ?? null : null,
      payment: paymentsBySub.get(s.id) ?? null,
    }
  })

  return { rows }
}
