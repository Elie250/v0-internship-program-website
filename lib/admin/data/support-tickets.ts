import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AdminSupportTicket = {
  id: string
  title: string
  description: string
  status: string
  priority: string | null
  admin_response: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  user_id: string | null
  subscription_id: string | null
  requester_name: string | null
  requester_email: string | null
  requester_phone: string | null
  category?: { name: string } | null
}

export async function querySupportTickets(): Promise<{
  tickets: AdminSupportTicket[]
  error?: string
}> {
  if (!supabaseAdmin) return { tickets: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*, category:support_categories(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return { tickets: [], error: error.message }
  return { tickets: (data ?? []) as AdminSupportTicket[] }
}

export async function updateSupportTicket(input: {
  id: string
  status?: string
  priority?: string
  admin_response?: string
  assigned_to?: string | null
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  let previousResponse: string | null = null
  let ticketMeta: {
    title: string
    requester_email: string | null
    requester_name: string | null
  } | null = null

  if (input.admin_response !== undefined && input.admin_response.trim()) {
    const { data: existing } = await supabaseAdmin
      .from('support_tickets')
      .select('title, requester_email, requester_name, admin_response')
      .eq('id', input.id)
      .maybeSingle()

    if (existing) {
      previousResponse = existing.admin_response as string | null
      ticketMeta = {
        title: String(existing.title),
        requester_email: existing.requester_email as string | null,
        requester_name: existing.requester_name as string | null,
      }
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.status) updates.status = input.status
  if (input.priority) updates.priority = input.priority
  if (input.admin_response !== undefined) updates.admin_response = input.admin_response || null
  if (input.assigned_to !== undefined) updates.assigned_to = input.assigned_to
  if (input.status === 'resolved' || input.status === 'closed') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin.from('support_tickets').update(updates).eq('id', input.id)
  if (error) return { error: error.message }

  const newResponse = input.admin_response?.trim()
  if (
    newResponse &&
    ticketMeta?.requester_email &&
    newResponse !== (previousResponse?.trim() ?? '')
  ) {
    const { sendSupportTicketResponseEmail } = await import('@/lib/email/notifications')
    void sendSupportTicketResponseEmail({
      to: ticketMeta.requester_email,
      requesterName: ticketMeta.requester_name?.trim() || ticketMeta.requester_email,
      ticketTitle: ticketMeta.title,
      adminResponse: newResponse,
    })
  }

  return {}
}
