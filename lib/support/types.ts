export type SupportPlanStatus = 'draft' | 'published' | 'archived'

export type SupportSubscriptionStatus =
  | 'payment_pending_review'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'refunded'

export type SupportTicketStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed'

export type SupportSubscriptionPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  duration_days: number
  max_tickets: number | null
  response_sla_hours: number | null
  plan_tier: 'free' | 'paid'
  max_ai_messages: number | null
  community_can_post: boolean
  community_can_reply: boolean
  features: string[]
  sort_order: number
  status: SupportPlanStatus
}

export type SupportSubscription = {
  id: string
  user_id: string
  plan_id: string
  status: SupportSubscriptionStatus
  payment_id: string | null
  applicant_phone: string | null
  tickets_used: number
  ai_messages_used: number
  starts_at: string | null
  ends_at: string | null
  admin_notes: string | null
  created_at: string
  plan?: SupportSubscriptionPlan
}

export type SupportAccessSummary = {
  hasActiveSubscription: boolean
  subscription: SupportSubscription | null
  ticketsRemaining: number | null
  aiMessagesRemaining: number | null
  canSubmitTicket: boolean
  canUseAiAssistant: boolean
  canPostCommunity: boolean
  canReplyCommunity: boolean
  canReadCommunity: boolean
  planTier: 'free' | 'paid' | null
  blockReason: string | null
}

export const SUPPORT_SUBSCRIBER_ROLES = ['engineer', 'registered', 'student'] as const
