/**
 * Post-auth destination rules for the recruitment portal.
 * Capabilities are derived from memberships / platform admin — never from a client role.
 */

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

/**
 * Resolve where to send the user after a magic-link is consumed.
 * `requestedRedirect` is only a return-path hint (apply flow, etc.), not a role.
 */
export function resolvePostAuthRedirect(input: {
  requestedRedirect?: string | null
  capabilities: RecruitmentCapabilities
  registerIntent?: RecruitmentRegisterIntent | null
}): string {
  const requested = safeRecruitmentRedirect(input.requestedRedirect)
  const { canUseEmployer } = input.capabilities

  if (input.registerIntent === 'employer' || (requested && isEmployerPath(requested))) {
    if (!canUseEmployer) return '/employer/get-access'
    if (
      requested &&
      isEmployerPath(requested) &&
      !requested.startsWith('/employer/auth') &&
      requested !== '/employer/get-access'
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

  if (canUseEmployer) return '/jobs/auth/choose'
  return '/app'
}

export function shouldCreateUserOnAuthRequest(mode: RecruitmentAuthMode | undefined): boolean {
  return mode === 'register'
}

export function sharedUserIdentity(emailA: string, emailB: string): boolean {
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase()
}

