import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function writeRecruitmentAudit(input: {
  actorUserId?: string | null
  organizationId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin.from('recruitment_audit_logs').insert([
    {
      actor_user_id: input.actorUserId ?? null,
      organization_id: input.organizationId ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    },
  ])
}
