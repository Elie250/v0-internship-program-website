import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function revokeSupportSubscription(
  subscriptionId: string,
  options?: { adminNotes?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: sub } = await supabaseAdmin
    .from('support_subscriptions')
    .select('admin_notes')
    .eq('id', subscriptionId)
    .maybeSingle()

  const note = options?.adminNotes?.trim()
  const adminNotes = [sub?.admin_notes, note ? `Refunded: ${note}` : 'Subscription refunded']
    .filter(Boolean)
    .join('\n')

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('support_subscriptions')
    .update({
      status: 'refunded',
      ends_at: now,
      admin_notes: adminNotes || null,
      updated_at: now,
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
