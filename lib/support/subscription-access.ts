import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { SupportAccessSummary, SupportSubscription, SupportSubscriptionPlan } from '@/lib/support/types'

function normalizePlan(row: Record<string, unknown>): SupportSubscriptionPlan {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price ?? 0),
    duration_days: Number(row.duration_days ?? 30),
    max_tickets: row.max_tickets != null ? Number(row.max_tickets) : null,
    response_sla_hours: row.response_sla_hours != null ? Number(row.response_sla_hours) : null,
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    sort_order: Number(row.sort_order ?? 0),
    status: String(row.status) as SupportSubscriptionPlan['status'],
  }
}

function normalizeSubscription(
  row: Record<string, unknown>,
  plan?: SupportSubscriptionPlan
): SupportSubscription {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    plan_id: String(row.plan_id),
    status: String(row.status) as SupportSubscription['status'],
    payment_id: row.payment_id != null ? String(row.payment_id) : null,
    applicant_phone: row.applicant_phone != null ? String(row.applicant_phone) : null,
    tickets_used: Number(row.tickets_used ?? 0),
    starts_at: row.starts_at != null ? String(row.starts_at) : null,
    ends_at: row.ends_at != null ? String(row.ends_at) : null,
    admin_notes: row.admin_notes != null ? String(row.admin_notes) : null,
    created_at: String(row.created_at),
    plan,
  }
}

export function isSubscriptionActive(sub: SupportSubscription): boolean {
  if (sub.status !== 'active') return false
  if (!sub.ends_at) return true
  return new Date(sub.ends_at).getTime() > Date.now()
}

export function ticketsRemaining(sub: SupportSubscription): number | null {
  const max = sub.plan?.max_tickets
  if (max == null) return null
  return Math.max(0, max - sub.tickets_used)
}

export function buildAccessSummary(sub: SupportSubscription | null): SupportAccessSummary {
  if (!sub) {
    return {
      hasActiveSubscription: false,
      subscription: null,
      ticketsRemaining: null,
      canSubmitTicket: false,
      blockReason: 'Subscribe to an engineering support plan to submit help requests.',
    }
  }

  if (sub.status === 'payment_pending_review') {
    return {
      hasActiveSubscription: false,
      subscription: sub,
      ticketsRemaining: null,
      canSubmitTicket: false,
      blockReason: 'Your subscription payment is awaiting admin receipt verification.',
    }
  }

  if (!isSubscriptionActive(sub)) {
    return {
      hasActiveSubscription: false,
      subscription: sub,
      ticketsRemaining: 0,
      canSubmitTicket: false,
      blockReason: 'Your support subscription has expired. Renew to submit new tickets.',
    }
  }

  const remaining = ticketsRemaining(sub)
  if (remaining !== null && remaining <= 0) {
    return {
      hasActiveSubscription: true,
      subscription: sub,
      ticketsRemaining: 0,
      canSubmitTicket: false,
      blockReason: 'You have used all tickets included in your current plan.',
    }
  }

  return {
    hasActiveSubscription: true,
    subscription: sub,
    ticketsRemaining: remaining,
    canSubmitTicket: true,
    blockReason: null,
  }
}

export async function getUserSupportAccess(userId: string): Promise<SupportAccessSummary> {
  if (!supabaseAdmin) {
    return buildAccessSummary(null)
  }

  const { data } = await supabaseAdmin
    .from('support_subscriptions')
    .select('*, plan:support_subscription_plans(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const rows = data ?? []
  const active = rows.find((row) => {
    const plan = row.plan ? normalizePlan(row.plan as Record<string, unknown>) : undefined
    const sub = normalizeSubscription(row as Record<string, unknown>, plan)
    return isSubscriptionActive(sub)
  })

  if (active) {
    const plan = active.plan ? normalizePlan(active.plan as Record<string, unknown>) : undefined
    return buildAccessSummary(normalizeSubscription(active as Record<string, unknown>, plan))
  }

  const pending = rows.find((row) => row.status === 'payment_pending_review')
  if (pending) {
    const plan = pending.plan ? normalizePlan(pending.plan as Record<string, unknown>) : undefined
    return buildAccessSummary(normalizeSubscription(pending as Record<string, unknown>, plan))
  }

  const latest = rows[0]
  if (latest) {
    const plan = latest.plan ? normalizePlan(latest.plan as Record<string, unknown>) : undefined
    return buildAccessSummary(normalizeSubscription(latest as Record<string, unknown>, plan))
  }

  return buildAccessSummary(null)
}
