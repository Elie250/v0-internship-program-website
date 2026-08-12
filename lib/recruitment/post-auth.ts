/**
 * Post-auth destination rules for the recruitment portal.
 * Capabilities are derived from memberships / platform admin — never from a client role.
 */

import {
  resolvePostAuthRedirectWithOnboarding,
  type EmployerOnboardingKind,
} from '@/lib/recruitment/onboarding-state'

export type RecruitmentAuthMode = 'signin' | 'register'
export type RecruitmentRegisterIntent = 'candidate' | 'employer'

export type RecruitmentCapabilities = {
  canUseCandidate: boolean
  canUseEmployer: boolean
}

export function safeRecruitmentRedirect(path?: string | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  return path
}

export function capabilitiesFromState(input: {
  hasActiveEmployerMembership: boolean
  isPlatformAdmin: boolean
}): RecruitmentCapabilities {
  return {
    canUseCandidate: true,
    canUseEmployer: input.hasActiveEmployerMembership || input.isPlatformAdmin,
  }
}

/**
 * Resolve where to send the user after a magic-link is consumed.
 * `requestedRedirect` is only a return-path hint (apply flow, etc.), not a role.
 */
export function resolvePostAuthRedirect(input: {
  requestedRedirect?: string | null
  capabilities: RecruitmentCapabilities
  registerIntent?: RecruitmentRegisterIntent | null
  onboardingKind?: EmployerOnboardingKind
}): string {
  return resolvePostAuthRedirectWithOnboarding({
    requestedRedirect: input.requestedRedirect,
    capabilities: input.capabilities,
    registerIntent: input.registerIntent,
    onboardingKind: input.onboardingKind ?? (input.capabilities.canUseEmployer ? 'active_employer' : 'none'),
  })
}

export function shouldCreateUserOnAuthRequest(mode: RecruitmentAuthMode | undefined): boolean {
  return mode === 'register'
}

export function sharedUserIdentity(emailA: string, emailB: string): boolean {
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase()
}
