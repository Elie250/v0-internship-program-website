import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AuditLogEntry = {
  id: string
  actorId: string | null
  actorEmail: string | null
  actorRole: string | null
  action: string
  module: string
  targetType: string | null
  targetId: string | null
  summary: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type LogAdminActionInput = {
  actorId?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  action: string
  module: string
  targetType?: string | null
  targetId?: string | null
  summary: string
  metadata?: Record<string, unknown>
}

export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  if (!supabaseAdmin) return

  const { error } = await supabaseAdmin.from('admin_audit_logs').insert({
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail ?? null,
    actor_role: input.actorRole ?? null,
    action: input.action,
    module: input.module,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  })

  if (error && !error.message.includes('admin_audit_logs')) {
    console.error('[audit] failed to log action:', error.message)
  }
}

export async function queryAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.message.includes('admin_audit_logs')) return []
    return []
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    actorId: row.actor_id != null ? String(row.actor_id) : null,
    actorEmail: row.actor_email != null ? String(row.actor_email) : null,
    actorRole: row.actor_role != null ? String(row.actor_role) : null,
    action: String(row.action),
    module: String(row.module),
    targetType: row.target_type != null ? String(row.target_type) : null,
    targetId: row.target_id != null ? String(row.target_id) : null,
    summary: String(row.summary),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  }))
}
