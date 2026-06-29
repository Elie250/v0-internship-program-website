import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function activateSupportSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: sub, error: fetchError } = await supabaseAdmin
    .from('support_subscriptions')
    .select('id, plan_id, status')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (fetchError || !sub) {
    return { success: false, error: fetchError?.message ?? 'Subscription not found' }
  }

  const { data: plan } = await supabaseAdmin
    .from('support_subscription_plans')
    .select('duration_days')
    .eq('id', sub.plan_id)
    .maybeSingle()

  const durationDays = Number(plan?.duration_days ?? 30)
  const startsAt = new Date()
  const endsAt = new Date(startsAt)
  endsAt.setDate(endsAt.getDate() + durationDays)

  const { error } = await supabaseAdmin
    .from('support_subscriptions')
    .update({
      status: 'active',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      tickets_used: 0,
      ai_messages_used: 0,
      updated_at: startsAt.toISOString(),
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function rejectSupportSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('support_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
