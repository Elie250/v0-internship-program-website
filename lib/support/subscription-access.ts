import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { SupportAccessSummary, SupportSubscription, SupportSubscriptionPlan } from '@/lib/support/types'
import {
  aiMessagesRemaining,
  canPostInCommunity,
  canReplyInCommunity,
  canUseAiAssistant,
  normalizePlanCapabilities,
} from '@/lib/support/plan-features'

function normalizePlan(row: Record<string, unknown>): SupportSubscriptionPlan {
  const price = Number(row.price ?? 0)
  const planTier = String(row.plan_tier ?? (price <= 0 ? 'free' : 'paid')) as 'free' | 'paid'
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description != null ? String(row.description) : null,
    price,
    duration_days: Number(row.duration_days ?? 30),
    max_tickets: row.max_tickets != null ? Number(row.max_tickets) : null,
    response_sla_hours: row.response_sla_hours != null ? Number(row.response_sla_hours) : null,
    plan_tier: planTier,
    max_ai_messages: row.max_ai_messages != null ? Number(row.max_ai_messages) : planTier === 'free' ? 5 : null,
    community_can_post: Boolean(row.community_can_post ?? planTier === 'paid'),
    community_can_reply: Boolean(row.community_can_reply ?? planTier === 'paid'),
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
    ai_messages_used: Number(row.ai_messages_used ?? 0),
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
  const plan = sub.plan
  if (!plan || plan.plan_tier === 'free' || plan.max_tickets === 0) return 0
  if (plan.max_tickets == null) return null
  return Math.max(0, plan.max_tickets - sub.tickets_used)
}

export function buildAccessSummary(sub: SupportSubscription | null): SupportAccessSummary {
  const empty: SupportAccessSummary = {
    hasActiveSubscription: false,
    subscription: null,
    ticketsRemaining: null,
    aiMessagesRemaining: null,
    canSubmitTicket: false,
    canUseAiAssistant: false,
    canPostCommunity: false,
    canReplyCommunity: false,
    canReadCommunity: false,
    planTier: null,
    blockReason: 'Subscribe to join the engineer community and access support tools.',
  }

  if (!sub) return empty

  const plan = sub.plan
  if (!plan) {
    return { ...empty, subscription: sub, blockReason: 'Subscription plan not found.' }
  }

  const caps = normalizePlanCapabilities(plan)

  if (sub.status === 'payment_pending_review') {
    return {
      hasActiveSubscription: false,
      subscription: sub,
      ticketsRemaining: null,
      aiMessagesRemaining: null,
      canSubmitTicket: false,
      canUseAiAssistant: false,
      canPostCommunity: false,
      canReplyCommunity: false,
      canReadCommunity: false,
      planTier: caps.tier,
      blockReason: 'Your subscription payment is awaiting admin receipt verification.',
    }
  }

  if (!isSubscriptionActive(sub)) {
    return {
      hasActiveSubscription: false,
      subscription: sub,
      ticketsRemaining: 0,
      aiMessagesRemaining: 0,
      canSubmitTicket: false,
      canUseAiAssistant: false,
      canPostCommunity: false,
      canReplyCommunity: false,
      canReadCommunity: false,
      planTier: caps.tier,
      blockReason: 'Your subscription has expired. Renew to continue.',
    }
  }

  const ticketRem = caps.canSubmitTicket ? ticketsRemaining(sub) : 0
  const aiRem = aiMessagesRemaining(sub, plan)
  const canTicket = caps.canSubmitTicket && (ticketRem === null || ticketRem > 0)
  const canAi = canUseAiAssistant(sub, plan)

  let blockReason: string | null = null
  if (!canTicket && !canAi && !caps.communityCanPost) {
    if (caps.tier === 'free') {
      blockReason = 'Upgrade to a paid plan to post in the community, open support tickets, and get more AI messages.'
    } else if (ticketRem === 0) {
      blockReason = 'You have used all support tickets on your current plan.'
    } else if (aiRem === 0) {
      blockReason = 'You have used all AI assistant messages on your current plan.'
    }
  }

  return {
    hasActiveSubscription: true,
    subscription: sub,
    ticketsRemaining: ticketRem,
    aiMessagesRemaining: aiRem,
    canSubmitTicket: canTicket,
    canUseAiAssistant: canAi,
    canPostCommunity: canPostInCommunity(plan),
    canReplyCommunity: canReplyInCommunity(plan),
    canReadCommunity: caps.communityCanRead,
    planTier: caps.tier,
    blockReason,
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
