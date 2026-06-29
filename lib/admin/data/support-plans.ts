import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { SupportSubscriptionPlan } from '@/lib/support/types'

function mapPlan(row: Record<string, unknown>): SupportSubscriptionPlan {
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
    max_ai_messages: row.max_ai_messages != null ? Number(row.max_ai_messages) : null,
    community_can_post: Boolean(row.community_can_post ?? planTier === 'paid'),
    community_can_reply: Boolean(row.community_can_reply ?? true),
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    sort_order: Number(row.sort_order ?? 0),
    status: String(row.status) as SupportSubscriptionPlan['status'],
  }
}

export async function queryPublishedSupportPlans(): Promise<{
  plans: SupportSubscriptionPlan[]
  error?: string
}> {
  if (!supabaseAdmin) return { plans: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('support_subscription_plans')
    .select('*')
    .eq('status', 'published')
    .order('sort_order')

  if (error) return { plans: [], error: error.message }
  return { plans: (data ?? []).map((row) => mapPlan(row as Record<string, unknown>)) }
}

export async function queryAllSupportPlans(): Promise<{
  plans: SupportSubscriptionPlan[]
  error?: string
}> {
  if (!supabaseAdmin) return { plans: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('support_subscription_plans')
    .select('*')
    .order('sort_order')

  if (error) return { plans: [], error: error.message }
  return { plans: (data ?? []).map((row) => mapPlan(row as Record<string, unknown>)) }
}

export async function upsertSupportPlan(input: {
  id?: string
  name: string
  slug: string
  description?: string
  price: number
  duration_days: number
  max_tickets?: number | null
  response_sla_hours?: number | null
  plan_tier?: 'free' | 'paid'
  max_ai_messages?: number | null
  community_can_post?: boolean
  community_can_reply?: boolean
  features?: string[]
  sort_order?: number
  status?: string
}): Promise<{ plan?: SupportSubscriptionPlan; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    description: input.description?.trim() || null,
    price: input.price,
    duration_days: input.duration_days,
    max_tickets: input.max_tickets ?? null,
    response_sla_hours: input.response_sla_hours ?? null,
    plan_tier: input.plan_tier ?? (input.price <= 0 ? 'free' : 'paid'),
    max_ai_messages: input.max_ai_messages ?? null,
    community_can_post: input.community_can_post ?? input.price > 0,
    community_can_reply: input.community_can_reply ?? true,
    features: input.features ?? [],
    sort_order: input.sort_order ?? 0,
    status: input.status ?? 'published',
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabaseAdmin
      .from('support_subscription_plans')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single()
    if (error) return { error: error.message }
    return { plan: mapPlan(data as Record<string, unknown>) }
  }

  const { data, error } = await supabaseAdmin
    .from('support_subscription_plans')
    .insert([payload])
    .select('*')
    .single()
  if (error) return { error: error.message }
  return { plan: mapPlan(data as Record<string, unknown>) }
}

export async function deleteSupportPlan(id: string): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { error } = await supabaseAdmin.from('support_subscription_plans').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}
