import { NextResponse } from 'next/server'
import {
  getRecruitmentSessionUser,
  isRecruitmentPlatformAdmin,
  listUserMemberships,
} from '@/lib/recruitment/authz'
import { getPendingInviteForEmail } from '@/lib/recruitment/organization-invites'
import {
  getLatestOrganizationRequestForUser,
  getPendingOrganizationRequestForUser,
} from '@/lib/recruitment/organization-requests'
import { resolveEmployerOnboardingKind } from '@/lib/recruitment/onboarding-state'
import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      memberships,
      { request: pendingRequest },
      { request: latestRequest },
      pendingInvite,
      { profile },
    ] = await Promise.all([
      listUserMemberships(user.id),
      getPendingOrganizationRequestForUser(user.id),
      getLatestOrganizationRequestForUser(user.id),
      getPendingInviteForEmail(user.email),
      ensureCandidateProfile(user.id),
    ])

    const isPlatformAdmin = isRecruitmentPlatformAdmin(user)
    const kind = resolveEmployerOnboardingKind({
      hasActiveEmployerMembership: memberships.length > 0,
      isPlatformAdmin,
      hasPendingOrganizationRequest: Boolean(pendingRequest),
      hasPendingInvite: Boolean(pendingInvite.invite),
      latestRequestStatus: latestRequest?.status ?? null,
    })

    const request = pendingRequest || latestRequest
    const nextStep =
      kind === 'active_employer'
        ? 'Open your employer workspace.'
        : kind === 'pending_invite'
          ? 'Accept your company invitation to unlock hiring access.'
          : kind === 'pending_request' && request?.request_type === 'new_organization'
            ? 'Wait for Energy & Logics to review and activate your company workspace.'
            : kind === 'pending_request'
              ? 'Ask your company administrator to invite this email address.'
              : kind === 'rejected_request'
                ? 'This organization request was not approved. Contact Energy & Logics if you need help.'
                : 'Register as an employer or ask a company admin to invite you.'

    return NextResponse.json({
      kind,
      canUseEmployerWorkspace: kind === 'active_employer',
      hasCandidateProfile: Boolean(profile),
      companyName: request?.company_name ?? pendingInvite.organizationName ?? null,
      requestStatus: request?.status ?? null,
      requestType: request?.request_type ?? null,
      submittedAt: request?.created_at ?? null,
      reviewedAt: request?.reviewed_at ?? null,
      reviewNotes: request?.review_notes ?? null,
      pendingInvite: pendingInvite.invite
        ? {
            id: pendingInvite.invite.id,
            organizationId: pendingInvite.invite.organization_id,
            role: pendingInvite.invite.role,
            email: pendingInvite.invite.email,
            expiresAt: pendingInvite.invite.expires_at,
            organizationName: pendingInvite.organizationName ?? null,
          }
        : null,
      nextStep,
      user: { id: user.id, email: user.email },
    })
  } catch {
    return NextResponse.json({ error: 'Could not load onboarding status' }, { status: 500 })
  }
}
