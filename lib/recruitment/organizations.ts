import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  isRecruitmentOrgStatus,
  slugifyOrganizationName,
  type RecruitmentOrganization,
  type RecruitmentOrgStatus,
} from '@/lib/recruitment/types'

const ORG_SELECT =
  'id, name, slug, description, logo_url, careers_blurb, status, notification_email, created_at, updated_at'

export async function listOrganizations(filters?: {
  status?: RecruitmentOrgStatus | 'all'
  search?: string
}): Promise<{ organizations: RecruitmentOrganization[]; error?: string }> {
  if (!supabaseAdmin) return { organizations: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('recruitment_organizations')
    .select(ORG_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) return { organizations: [], error: error.message }
  return { organizations: (data ?? []) as RecruitmentOrganization[] }
}

export async function getOrganizationById(
  id: string
): Promise<{ organization: RecruitmentOrganization | null; error?: string }> {
  if (!supabaseAdmin) return { organization: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_organizations')
    .select(ORG_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return { organization: null, error: error.message }
  return { organization: (data as RecruitmentOrganization | null) ?? null }
}

export async function getOrganizationBySlug(
  slug: string
): Promise<{ organization: RecruitmentOrganization | null; error?: string }> {
  if (!supabaseAdmin) return { organization: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_organizations')
    .select(ORG_SELECT)
    .eq('slug', slug.trim().toLowerCase())
    .maybeSingle()
  if (error) return { organization: null, error: error.message }
  return { organization: (data as RecruitmentOrganization | null) ?? null }
}

export async function createOrganization(input: {
  name: string
  slug?: string
  description?: string
  careersBlurb?: string
  notificationEmail?: string
  status?: RecruitmentOrgStatus
  actorUserId: string
}): Promise<{ organization?: RecruitmentOrganization; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const name = input.name.trim()
  if (!name) return { error: 'Organization name is required' }

  let slug = (input.slug?.trim() || slugifyOrganizationName(name)).toLowerCase()
  if (!slug) return { error: 'Organization slug is required' }

  const status = input.status && isRecruitmentOrgStatus(input.status) ? input.status : 'draft'

  const { data, error } = await supabaseAdmin
    .from('recruitment_organizations')
    .insert([
      {
        name,
        slug,
        description: input.description?.trim() || null,
        careers_blurb: input.careersBlurb?.trim() || null,
        notification_email: input.notificationEmail?.trim().toLowerCase() || null,
        status,
      },
    ])
    .select(ORG_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: data.id,
    action: 'organization_created',
    entityType: 'recruitment_organizations',
    entityId: data.id,
    metadata: { name, slug, status },
  })

  return { organization: data as RecruitmentOrganization }
}

export async function updateOrganization(input: {
  id: string
  name?: string
  description?: string | null
  careersBlurb?: string | null
  logoUrl?: string | null
  notificationEmail?: string | null
  status?: RecruitmentOrgStatus
  actorUserId: string
}): Promise<{ organization?: RecruitmentOrganization; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.description !== undefined) updates.description = input.description?.trim() || null
  if (input.careersBlurb !== undefined) updates.careers_blurb = input.careersBlurb?.trim() || null
  if (input.logoUrl !== undefined) updates.logo_url = input.logoUrl?.trim() || null
  if (input.notificationEmail !== undefined) {
    updates.notification_email = input.notificationEmail?.trim().toLowerCase() || null
  }
  if (input.status !== undefined) {
    if (!isRecruitmentOrgStatus(input.status)) return { error: 'Invalid status' }
    updates.status = input.status
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_organizations')
    .update(updates)
    .eq('id', input.id)
    .select(ORG_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Organization not found' }

  const action =
    input.status === 'suspended'
      ? 'organization_suspended'
      : input.status === 'active'
        ? 'organization_activated'
        : 'organization_updated'

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: data.id,
    action,
    entityType: 'recruitment_organizations',
    entityId: data.id,
    metadata: updates,
  })

  return { organization: data as RecruitmentOrganization }
}
