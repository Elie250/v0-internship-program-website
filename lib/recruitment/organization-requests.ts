import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { createOrganization } from '@/lib/recruitment/organizations'
import { upsertOrganizationMember } from '@/lib/recruitment/memberships'
import { slugifyOrganizationName } from '@/lib/recruitment/types'
import { normalizeRecruitmentEmail } from '@/lib/recruitment/email-normalize'
import {
  sendEmployerAccessApprovedEmail,
  sendEmployerRequestConfirmationEmail,
  sendEmployerRequestRejectedEmail,
} from '@/lib/recruitment/employer-onboarding-emails'

export const ORG_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'] as const
export type OrgRequestStatus = (typeof ORG_REQUEST_STATUSES)[number]

export const ORG_REQUEST_TYPES = ['new_organization', 'access_existing'] as const
export type OrgRequestType = (typeof ORG_REQUEST_TYPES)[number]

export type OrganizationRequest = {
  id: string
  requester_user_id: string
  organization_id: string | null
  company_name: string
  suggested_slug: string | null
  contact_email: string
  request_type: OrgRequestType
  status: OrgRequestStatus
  requester_notes: string | null
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

const REQUEST_SELECT =
  'id, requester_user_id, organization_id, company_name, suggested_slug, contact_email, request_type, status, requester_notes, review_notes, reviewed_by, reviewed_at, created_at, updated_at'

export function isOrgRequestStatus(value: string): value is OrgRequestStatus {
  return (ORG_REQUEST_STATUSES as readonly string[]).includes(value)
}

export async function getPendingOrganizationRequestForUser(
  userId: string
): Promise<{ request: OrganizationRequest | null; error?: string }> {
  if (!supabaseAdmin) return { request: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .select(REQUEST_SELECT)
    .eq('requester_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { request: null, error: error.message }
  return { request: (data as OrganizationRequest | null) ?? null }
}

export async function getLatestOrganizationRequestForUser(
  userId: string
): Promise<{ request: OrganizationRequest | null; error?: string }> {
  if (!supabaseAdmin) return { request: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .select(REQUEST_SELECT)
    .eq('requester_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { request: null, error: error.message }
  return { request: (data as OrganizationRequest | null) ?? null }
}

export async function listOrganizationRequests(filters?: {
  status?: OrgRequestStatus | 'all'
}): Promise<{ requests: OrganizationRequest[]; error?: string }> {
  if (!supabaseAdmin) return { requests: [], error: 'Database not configured' }
  let query = supabaseAdmin
    .from('recruitment_organization_requests')
    .select(REQUEST_SELECT)
    .order('created_at', { ascending: false })
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  const { data, error } = await query
  if (error) return { requests: [], error: error.message }
  return { requests: (data ?? []) as OrganizationRequest[] }
}

export async function ensureEmployerOrganizationRequest(input: {
  userId: string
  email: string
  companyName?: string | null
  notes?: string | null
  sendConfirmationEmail?: boolean
}): Promise<{ request?: OrganizationRequest; created: boolean; error?: string }> {
  if (!supabaseAdmin) return { created: false, error: 'Database not configured' }

  const pending = await getPendingOrganizationRequestForUser(input.userId)
  if (pending.error) return { created: false, error: pending.error }
  if (pending.request) {
    return { request: pending.request, created: false }
  }

  const contactEmail = normalizeRecruitmentEmail(input.email) || input.email.trim().toLowerCase()
  const trimmedCompany = input.companyName?.trim().slice(0, 120) || ''
  const requestType: OrgRequestType = trimmedCompany ? 'new_organization' : 'access_existing'
  const companyName =
    trimmedCompany || 'Access to existing hiring partner (awaiting company invite)'
  const suggestedSlug = trimmedCompany ? slugifyOrganizationName(trimmedCompany) : null

  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .insert([
      {
        requester_user_id: input.userId,
        company_name: companyName,
        suggested_slug: suggestedSlug || null,
        contact_email: contactEmail,
        request_type: requestType,
        status: 'pending',
        requester_notes: input.notes?.trim().slice(0, 2000) || null,
      },
    ])
    .select(REQUEST_SELECT)
    .single()

  if (error) return { created: false, error: error.message }

  const request = data as OrganizationRequest

  await writeRecruitmentAudit({
    actorUserId: input.userId,
    organizationId: null,
    action: 'organization_access_requested',
    entityType: 'recruitment_organization_requests',
    entityId: request.id,
    metadata: {
      companyName: request.company_name,
      requestType: request.request_type,
      contactEmail: request.contact_email,
    },
  })

  if (input.sendConfirmationEmail) {
    await sendEmployerRequestConfirmationEmail({
      to: contactEmail,
      companyName: request.company_name,
      requestType: request.request_type,
    })
  }

  return { request, created: true }
}

export async function approveOrganizationRequest(input: {
  requestId: string
  actorUserId: string
  reviewNotes?: string | null
  organizationName?: string | null
  adminUserId?: string | null
}): Promise<{ request?: OrganizationRequest; organizationId?: string; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: existing, error: loadError } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .select(REQUEST_SELECT)
    .eq('id', input.requestId)
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!existing) return { error: 'Request not found' }
  const request = existing as OrganizationRequest
  if (request.status !== 'pending') return { error: 'Only pending requests can be approved' }
  if (request.request_type !== 'new_organization') {
    return { error: 'This request waits for a company admin invite, not platform approval' }
  }

  const name = (input.organizationName?.trim() || request.company_name).slice(0, 120)
  let organizationId = request.organization_id

  if (!organizationId) {
    const created = await createOrganization({
      name,
      slug: request.suggested_slug || undefined,
      notificationEmail: request.contact_email,
      status: 'active',
      actorUserId: input.actorUserId,
    })
    if (created.error || !created.organization) {
      return { error: created.error ?? 'Could not create organization' }
    }
    organizationId = created.organization.id
  } else {
    const { error: activateError } = await supabaseAdmin
      .from('recruitment_organizations')
      .update({
        status: 'active',
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
    if (activateError) return { error: activateError.message }
  }

  const adminUserId = input.adminUserId || request.requester_user_id
  const memberResult = await upsertOrganizationMember({
    organizationId,
    userId: adminUserId,
    role: 'organization_admin',
    status: 'active',
    actorUserId: input.actorUserId,
  })
  if (memberResult.error) return { error: memberResult.error }

  const reviewedAt = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .update({
      status: 'approved',
      organization_id: organizationId,
      review_notes: input.reviewNotes?.trim().slice(0, 2000) || null,
      reviewed_by: input.actorUserId,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq('id', request.id)
    .eq('status', 'pending')
    .select(REQUEST_SELECT)
    .maybeSingle()

  if (updateError) return { error: updateError.message }
  if (!updated) return { error: 'Request was already processed' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId,
    action: 'organization_request_approved',
    entityType: 'recruitment_organization_requests',
    entityId: request.id,
    metadata: {
      adminUserId,
      reviewNotes: input.reviewNotes?.trim().slice(0, 500) || null,
    },
  })

  await sendEmployerAccessApprovedEmail({
    to: request.contact_email,
    companyName: name,
  })

  return {
    request: updated as OrganizationRequest,
    organizationId,
  }
}

export async function rejectOrganizationRequest(input: {
  requestId: string
  actorUserId: string
  reviewNotes?: string | null
}): Promise<{ request?: OrganizationRequest; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const reviewedAt = new Date().toISOString()
  const { data: updated, error } = await supabaseAdmin
    .from('recruitment_organization_requests')
    .update({
      status: 'rejected',
      review_notes: input.reviewNotes?.trim().slice(0, 2000) || null,
      reviewed_by: input.actorUserId,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq('id', input.requestId)
    .eq('status', 'pending')
    .select(REQUEST_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Request not found or already processed' }

  const request = updated as OrganizationRequest

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: request.organization_id,
    action: 'organization_request_rejected',
    entityType: 'recruitment_organization_requests',
    entityId: request.id,
    metadata: { reviewNotes: input.reviewNotes?.trim().slice(0, 500) || null },
  })

  await sendEmployerRequestRejectedEmail({
    to: request.contact_email,
    companyName: request.company_name,
    reason: input.reviewNotes,
  })

  return { request }
}
