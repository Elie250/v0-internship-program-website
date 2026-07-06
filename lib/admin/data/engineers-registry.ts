import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type EngineerSubscriptionSummary = {
  subscriptionId: string
  planName: string
  status: string
  expiresAt: string | null
  createdAt: string
}

export type EngineerRegistryRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  status: string
  createdAt: string
  subscriptions: EngineerSubscriptionSummary[]
  activeSubscription: boolean
  openTickets: number
}

export async function queryEngineersRegistry(filters?: {
  search?: string
}): Promise<{ engineers: EngineerRegistryRow[]; error?: string }> {
  if (!supabaseAdmin) {
    return { engineers: [], error: 'Database not configured' }
  }

  let userQuery = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, phone, status, created_at')
    .eq('role', 'engineer')
    .order('created_at', { ascending: false })

  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    userQuery = userQuery.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
    )
  }

  const { data: users, error: userError } = await userQuery
  if (userError) return { engineers: [], error: userError.message }

  const userIds = (users ?? []).map((u) => u.id)
  let subscriptionRows: Array<Record<string, unknown>> = []
  let ticketCounts = new Map<string, number>()

  if (userIds.length) {
    const [subsResult, ticketsResult] = await Promise.all([
      supabaseAdmin
        .from('support_subscriptions')
        .select('id, user_id, status, created_at, ends_at, plan:support_subscription_plans(name)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('support_tickets')
        .select('user_id, status')
        .in('user_id', userIds)
        .in('status', ['open', 'in_progress', 'pending']),
    ])

    if (subsResult.error) return { engineers: [], error: subsResult.error.message }
    subscriptionRows = subsResult.data ?? []

    for (const ticket of ticketsResult.data ?? []) {
      const uid = String(ticket.user_id ?? '')
      ticketCounts.set(uid, (ticketCounts.get(uid) ?? 0) + 1)
    }
  }

  const subsByUser = new Map<string, EngineerSubscriptionSummary[]>()
  for (const row of subscriptionRows) {
    const userId = String(row.user_id ?? '')
    if (!userId) continue
    const planRel = row.plan as { name?: string } | { name?: string }[] | null
    const planName = Array.isArray(planRel)
      ? planRel[0]?.name ?? 'Plan'
      : planRel?.name ?? 'Plan'
    const summary: EngineerSubscriptionSummary = {
      subscriptionId: String(row.id),
      planName,
      status: String(row.status ?? ''),
      expiresAt: (row.ends_at as string | null) ?? null,
      createdAt: String(row.created_at ?? ''),
    }
    const list = subsByUser.get(userId) ?? []
    list.push(summary)
    subsByUser.set(userId, list)
  }

  const engineers: EngineerRegistryRow[] = (users ?? []).map((u) => {
    const firstName = u.first_name ?? ''
    const lastName = u.last_name ?? ''
    const subscriptions = subsByUser.get(u.id) ?? []
    const activeSubscription = subscriptions.some((s) => s.status === 'active')
    return {
      id: u.id,
      email: u.email,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || u.email,
      phone: u.phone ?? null,
      status: String(u.status ?? 'active'),
      createdAt: u.created_at,
      subscriptions,
      activeSubscription,
      openTickets: ticketCounts.get(u.id) ?? 0,
    }
  })

  return { engineers }
}
