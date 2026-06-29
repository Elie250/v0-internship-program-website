import type { SupportSubscription, SupportSubscriptionPlan } from '@/lib/support/types'

export type PlanCapabilities = {
  tier: 'free' | 'paid'
  maxTickets: number | null
  maxAiMessages: number | null
  communityCanPost: boolean
  communityCanReply: boolean
  communityCanRead: boolean
  canSubmitTicket: boolean
}

export function normalizePlanCapabilities(plan: SupportSubscriptionPlan): PlanCapabilities {
  const tier = plan.plan_tier ?? (Number(plan.price) <= 0 ? 'free' : 'paid')
  return {
    tier,
    maxTickets: plan.max_tickets,
    maxAiMessages: plan.max_ai_messages ?? (tier === 'free' ? 5 : null),
    communityCanPost: plan.community_can_post ?? tier === 'paid',
    communityCanReply: plan.community_can_reply ?? tier === 'paid',
    communityCanRead: true,
    canSubmitTicket: tier === 'paid' && (plan.max_tickets == null || plan.max_tickets > 0),
  }
}

export function aiMessagesRemaining(
  sub: SupportSubscription,
  plan: SupportSubscriptionPlan
): number | null {
  const caps = normalizePlanCapabilities(plan)
  if (caps.maxAiMessages == null) return null
  return Math.max(0, caps.maxAiMessages - (sub.ai_messages_used ?? 0))
}

export function canUseAiAssistant(sub: SupportSubscription, plan: SupportSubscriptionPlan): boolean {
  const remaining = aiMessagesRemaining(sub, plan)
  if (remaining == null) return true
  return remaining > 0
}

export function canPostInCommunity(plan: SupportSubscriptionPlan): boolean {
  return normalizePlanCapabilities(plan).communityCanPost
}

export function canReplyInCommunity(plan: SupportSubscriptionPlan): boolean {
  return normalizePlanCapabilities(plan).communityCanReply
}
