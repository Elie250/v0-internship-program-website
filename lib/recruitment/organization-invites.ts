import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { normalizeRecruitmentEmail } from '@/lib/recruitment/email-normalize'
import { upsertOrganizationMember } from '@/lib/recruitment/memberships'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { isRecruitmentOrgRole, type RecruitmentOrgRole } from '@/lib/recruitment/types'
import { findUserByNormalizedEmail } from '@/lib/recruitment/user-lookup'
import { sendOrganizationInviteEmail } from '@/lib/recruitment/employer-onboarding-emails'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export type OrganizationInvite = {
  id: string
  organization_id: string
  email: string
  role: RecruitmentOrgRole
  token_hash: string
  invited_by: string | null
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

const INVITE_SELECT =
  'id, organization_id, email, role, token_hash, invited_by, status, expires_at, accepted_at, created_at, updated_at'

export async function createOrganizationInvite(input: {
  organizationId: string
  email: string
  role: RecruitmentOrgRole
  invitedByUserId: string
}): Promise<{ invite?: OrganizationInvite; rawToken?: string; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isRecruitmentOrgRole(input.role)) return { error: 'Invalid role' }

  const email = normalizeRecruitmentEmail(input.email)
  if (!email) return { error: 'Valid email is required' }

  const org = await getOrganizationById(input.organizationId)
  if (org.error || !org.organization) return { error: org.error ?? 'Organization not found' }
  if (org.organization.status === 'suspended') {
    return { error: 'Cannot invite members to a suspended organization' }
  }
  if (org.organization.status !== 'active') {
    return { error: 'Organization must be active before inviting members' }
  }

  // Expire prior pending invites for same email+org
  await supabaseAdmin
    .from('recruitment_organization_invites')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', input.organizationId)
    .eq('email', email)
    .eq('status', 'pending')

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString()

  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_invites')
    .insert([
      {
        organization_id: input.organizationId,
        email,
        role: input.role,
        token_hash: tokenHash,
        invited_by: input.invitedByUserId,
        status: 'pending',
        expires_at: expiresAt,
      },
    ])
    .select(INVITE_SELECT)
    .single()

  if (error) return { error: error.message }

  const invite = data as OrganizationInvite

  await writeRecruitmentAudit({
    actorUserId: input.invitedByUserId,
    organizationId: input.organizationId,
    action: 'organization_invite_created',
    entityType: 'recruitment_organization_invites',
    entityId: invite.id,
    metadata: { email, role: input.role },
  })

  await sendOrganizationInviteEmail({
    to: email,
    companyName: org.organization.name,
    role: input.role,
    rawToken,
  })

  return { invite, rawToken }
}

export async function getPendingInviteForEmail(
  email: string
): Promise<{ invite: OrganizationInvite | null; organizationName?: string; error?: string }> {
  if (!supabaseAdmin) return { invite: null, error: 'Database not configured' }
  const normalized = normalizeRecruitmentEmail(email)
  if (!normalized) return { invite: null }

  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_invites')
    .select(
      `${INVITE_SELECT}, organization:recruitment_organizations(id, name, status)`
    )
    .eq('email', normalized)
    .eq('status', 'pending')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { invite: null, error: error.message }
  if (!data) return { invite: null }

  const org = Array.isArray(data.organization) ? data.organization[0] : data.organization
  if (org && String(org.status) !== 'active') return { invite: null }

  const invite = data as unknown as OrganizationInvite
  return {
    invite,
    organizationName: org ? String(org.name) : undefined,
  }
}

export async function getInviteByRawToken(
  rawToken: string
): Promise<{
  invite: OrganizationInvite | null
  organizationName?: string
  organizationStatus?: string
  error?: string
}> {
  if (!supabaseAdmin) return { invite: null, error: 'Database not configured' }
  const token = rawToken?.trim()
  if (!token) return { invite: null, error: 'Invalid invitation' }

  const tokenHash = hashToken(token)
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_invites')
    .select(
      `${INVITE_SELECT}, organization:recruitment_organizations(id, name, status)`
    )
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) return { invite: null, error: error.message }
  if (!data) return { invite: null, error: 'Invitation not found' }

  const org = Array.isArray(data.organization) ? data.organization[0] : data.organization
  const invite = data as unknown as OrganizationInvite

  return {
    invite,
    organizationName: org ? String(org.name) : undefined,
    organizationStatus: org ? String(org.status) : undefined,
  }
}

/**
 * Accept invite for the authenticated user. Email must match invite email.
 * Client cannot choose role or organization_id — both come from the invite row.
 */
export async function acceptOrganizationInvite(input: {
  rawToken: string
  userId: string
  userEmail: string
}): Promise<{ membershipId?: string; organizationId?: string; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const lookedUp = await getInviteByRawToken(input.rawToken)
  if (lookedUp.error || !lookedUp.invite) {
    return { error: lookedUp.error ?? 'Invitation not found' }
  }

  const invite = lookedUp.invite
  if (invite.status !== 'pending') return { error: 'This invitation is no longer pending' }
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin
      .from('recruitment_organization_invites')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', invite.id)
    return { error: 'This invitation has expired' }
  }

  if (lookedUp.organizationStatus !== 'active') {
    return { error: 'This organization is not active' }
  }

  const userEmail = normalizeRecruitmentEmail(input.userEmail)
  if (!userEmail || userEmail !== normalizeRecruitmentEmail(invite.email)) {
    return { error: 'Sign in with the invited email address to accept this invitation' }
  }

  // Ensure user exists for email (already authenticated)
  const { user } = await findUserByNormalizedEmail(userEmail)
  if (!user || user.id !== input.userId) {
    return { error: 'Signed-in account does not match this invitation' }
  }

  const memberResult = await upsertOrganizationMember({
    organizationId: invite.organization_id,
    userId: input.userId,
    role: invite.role,
    status: 'active',
    actorUserId: input.userId,
  })
  if (memberResult.error || !memberResult.membership) {
    return { error: memberResult.error ?? 'Could not activate membership' }
  }

  const acceptedAt = new Date().toISOString()
  const { error: acceptError } = await supabaseAdmin
    .from('recruitment_organization_invites')
    .update({
      status: 'accepted',
      accepted_at: acceptedAt,
      updated_at: acceptedAt,
    })
    .eq('id', invite.id)
    .eq('status', 'pending')

  if (acceptError) return { error: acceptError.message }

  await writeRecruitmentAudit({
    actorUserId: input.userId,
    organizationId: invite.organization_id,
    action: 'organization_invite_accepted',
    entityType: 'recruitment_organization_invites',
    entityId: invite.id,
    metadata: { role: invite.role },
  })

  return {
    membershipId: memberResult.membership.id,
    organizationId: invite.organization_id,
  }
}

export async function listOrganizationInvites(organizationId: string) {
  if (!supabaseAdmin) return { invites: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_invites')
    .select(INVITE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) return { invites: [], error: error.message }
  return { invites: (data ?? []) as OrganizationInvite[] }
}
