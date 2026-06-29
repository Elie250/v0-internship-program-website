import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function querySupportSubscriptions(): Promise<{
  subscriptions: Record<string, unknown>[]
  error?: string
}> {
  if (!supabaseAdmin) return { subscriptions: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('support_subscriptions')
    .select('*, plan:support_subscription_plans(name, price, duration_days, max_tickets), user:users(email, first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return { subscriptions: [], error: error.message }
  return { subscriptions: data ?? [] }
}
