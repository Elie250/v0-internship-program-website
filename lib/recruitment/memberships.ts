import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  isRecruitmentOrgRole,
  type RecruitmentMembership,
  type RecruitmentOrgRole,
} from '@/lib/recruitment/types'

export async function listOrganizationMembers(organizationId: string) {
  if (!supabaseAdmin) return { members: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .select(
      'id, organization_id, user_id, role, status, created_at, updated_at, user:users(id, email, first_name, last_name)'
    )
    .eq('organization_id', organizationId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })

  if (error) return { members: [], error: error.message }
  return { members: data ?? [] }
}

export async function upsertOrganizationMember(input: {
  organizationId: string
  userId: string
  role: RecruitmentOrgRole
  status?: 'active' | 'invited' | 'suspended'
  actorUserId: string
}): Promise<{ membership?: RecruitmentMembership; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isRecruitmentOrgRole(input.role)) return { error: 'Invalid role' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .upsert(
      [
        {
          organization_id: input.organizationId,
          user_id: input.userId,
          role: input.role,
          status: input.status ?? 'active',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'organization_id,user_id' }
    )
    .select('id, organization_id, user_id, role, status, created_at, updated_at')
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'member_role_changed',
    entityType: 'recruitment_organization_memberships',
    entityId: data.id,
    metadata: { userId: input.userId, role: input.role, status: input.status ?? 'active' },
  })

  return { membership: data as RecruitmentMembership }
}

export async function removeOrganizationMember(input: {
  organizationId: string
  membershipId: string
  actorUserId: string
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', input.membershipId)
    .eq('organization_id', input.organizationId)
    .select('id, user_id')
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'Membership not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'member_removed',
    entityType: 'recruitment_organization_memberships',
    entityId: data.id,
    metadata: { userId: data.user_id },
  })

  return { success: true }
}
