/**
 * Server-side employer onboarding destination rules.
 * Capabilities and approval state are never taken from the browser.
 */

import type { RecruitmentCapabilities, RecruitmentRegisterIntent } from '@/lib/recruitment/post-auth'
import { safeRecruitmentRedirect } from '@/lib/recruitment/post-auth'

export type EmployerOnboardingKind =
  | 'active_employer'
  | 'pending_request'
  | 'pending_invite'
  | 'rejected_request'
  | 'none'

export type EmployerOnboardingSnapshot = {
  kind: EmployerOnboardingKind
  canUseEmployerWorkspace: boolean
  companyName?: string | null
  requestStatus?: string | null
  submittedAt?: string | null
  reviewNotes?: string | null
  hasCandidateProfile?: boolean
}

export function resolveEmployerOnboardingKind(input: {
  hasActiveEmployerMembership: boolean
  isPlatformAdmin: boolean
  hasPendingOrganizationRequest: boolean
  hasPendingInvite: boolean
  latestRequestStatus?: string | null
}): EmployerOnboardingKind {
  if (input.hasActiveEmployerMembership || input.isPlatformAdmin) return 'active_employer'
  if (input.hasPendingInvite) return 'pending_invite'
  if (input.hasPendingOrganizationRequest) return 'pending_request'
  if (input.latestRequestStatus === 'rejected') return 'rejected_request'
  return 'none'
}

function isEmployerPath(path: string): boolean {
  return path === '/employer' || path.startsWith('/employer/')
}

function isCandidatePath(path: string): boolean {
  return (
    path === '/app' ||
    path.startsWith('/app/') ||
    path.startsWith('/o/') ||
    path === '/jobs' ||
    path.startsWith('/jobs/')
  )
}

const PUBLIC_EMPLOYER_ONBOARDING_PATHS = [
  '/employer/pending',
  '/employer/invitation',
  '/employer/get-access',
]

function isAllowedEmployerOnboardingPath(path: string): boolean {
  return PUBLIC_EMPLOYER_ONBOARDING_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}?`)
  )
}

/**
 * Resolve post-auth redirect using server-derived capabilities + onboarding kind.
 */
export function resolvePostAuthRedirectWithOnboarding(input: {
  requestedRedirect?: string | null
  capabilities: RecruitmentCapabilities
  registerIntent?: RecruitmentRegisterIntent | null
  onboardingKind: EmployerOnboardingKind
}): string {
  const requested = safeRecruitmentRedirect(input.requestedRedirect)
  const { canUseEmployer } = input.capabilities
  const kind = input.onboardingKind

  // Explicit invitation return path (token in query is preserved by caller)
  if (requested && requested.startsWith('/employer/invitation')) {
    return requested
  }

  if (kind === 'active_employer' || canUseEmployer) {
    if (input.registerIntent === 'employer' || (requested && isEmployerPath(requested))) {
      if (
        requested &&
        isEmployerPath(requested) &&
        !requested.startsWith('/employer/auth') &&
        !isAllowedEmployerOnboardingPath(requested)
      ) {
        return requested
      }
      return '/employer'
    }
    if (input.registerIntent === 'candidate') {
      if (requested && isCandidatePath(requested) && !requested.startsWith('/jobs/auth')) {
        return requested
      }
      return '/app'
    }
    if (requested && (requested.startsWith('/app') || requested.startsWith('/o/'))) {
      return requested
    }
    // Both capabilities, no specific destination
    return '/jobs/auth/choose'
  }

  // No employer workspace access
  if (input.registerIntent === 'employer' || (requested && isEmployerPath(requested))) {
    if (kind === 'pending_invite') return '/employer/invitation'
    if (kind === 'pending_request' || kind === 'rejected_request') return '/employer/pending'
    return '/employer/pending'
  }

  if (input.registerIntent === 'candidate') {
    if (requested && isCandidatePath(requested) && !requested.startsWith('/jobs/auth')) {
      return requested
    }
    return '/app'
  }

  if (requested && (requested.startsWith('/app') || requested.startsWith('/o/'))) {
    return requested
  }

  return '/app'
}

export function canEnterEmployerWorkspace(input: {
  isAuthenticated: boolean
  hasActiveEmployerMembership: boolean
  isPlatformAdmin: boolean
  organizationStatus?: string | null
}): boolean {
  if (!input.isAuthenticated) return false
  if (input.isPlatformAdmin) return true
  if (!input.hasActiveEmployerMembership) return false
  if (input.organizationStatus && input.organizationStatus !== 'active') return false
  return true
}

/** Browser-supplied role / org / approval must never grant access. */
export function employerAccessFromClientClaims(_claims: {
  role?: string
  organization_id?: string
  approval_status?: string
}): boolean {
  return false
}

export function magicLinkGrantsEmployerAccess(): boolean {
  return false
}
