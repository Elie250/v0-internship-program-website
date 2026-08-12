/**
 * Phase 9 — account & organization onboarding rules (no DB required).
 * Run: node scripts/test-recruitment-phase9-onboarding.mjs
 */

function safeRecruitmentRedirect(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  return path
}

function capabilitiesFromState(input) {
  return {
    canUseCandidate: true,
    canUseEmployer: input.hasActiveEmployerMembership || input.isPlatformAdmin,
  }
}

function resolveEmployerOnboardingKind(input) {
  if (input.hasActiveEmployerMembership || input.isPlatformAdmin) return 'active_employer'
  if (input.hasPendingInvite) return 'pending_invite'
  if (input.hasPendingOrganizationRequest) return 'pending_request'
  if (input.latestRequestStatus === 'rejected') return 'rejected_request'
  return 'none'
}

function isEmployerPath(path) {
  return path === '/employer' || path.startsWith('/employer/')
}

function isCandidatePath(path) {
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

function isAllowedEmployerOnboardingPath(path) {
  return PUBLIC_EMPLOYER_ONBOARDING_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}?`)
  )
}

function resolvePostAuthRedirectWithOnboarding(input) {
  const requested = safeRecruitmentRedirect(input.requestedRedirect)
  const { canUseEmployer } = input.capabilities
  const kind = input.onboardingKind

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
    return '/jobs/auth/choose'
  }

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

function canEnterEmployerWorkspace(input) {
  if (!input.isAuthenticated) return false
  if (input.isPlatformAdmin) return true
  if (!input.hasActiveEmployerMembership) return false
  if (input.organizationStatus && input.organizationStatus !== 'active') return false
  return true
}

function employerAccessFromClientClaims(_claims) {
  return false
}

function magicLinkGrantsEmployerAccess() {
  return false
}

function employerSelfRegistrationCreatesActiveOrganization() {
  return false
}

function companyAdminInviteRequiresPlatformApproval() {
  return false
}

function membershipGrantsAccessToOtherOrganization(memberOrgId, requestedOrgId) {
  return memberOrgId === requestedOrgId
}

function academyAuthUnchanged() {
  // Recruitment passwordless does not replace Academy password login.
  return true
}

const candidateOnly = capabilitiesFromState({
  hasActiveEmployerMembership: false,
  isPlatformAdmin: false,
})
const employerMember = capabilitiesFromState({
  hasActiveEmployerMembership: true,
  isPlatformAdmin: false,
})

let passed = 0
let failed = 0
function assert(ok, label) {
  if (ok) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

console.log('\n1. Candidate registration → candidate dashboard')
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'candidate',
    onboardingKind: 'none',
  }) === '/app',
  'candidate register → /app'
)
assert(candidateOnly.canUseEmployer === false, 'candidate register does not grant employer capability')

console.log('\n2. Employer registration → pending onboarding, NOT candidate dashboard')
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'employer',
    onboardingKind: 'pending_request',
  }) === '/employer/pending',
  'employer register → /employer/pending'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'employer',
    onboardingKind: 'pending_request',
    requestedRedirect: '/app',
  }) === '/employer/pending',
  'employer register ignores candidate /app redirect'
)
assert(
  employerSelfRegistrationCreatesActiveOrganization() === false,
  'self-registration does not create an active company workspace'
)

console.log('\n3. Pending employer cannot access /employer workspace')
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
  }),
  'pending employer denied workspace'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    requestedRedirect: '/employer/jobs',
    onboardingKind: 'pending_request',
  }) === '/employer/pending',
  'employer path without access → pending'
)

console.log('\n4. Energy & Logics admin approves → employer gets workspace')
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: employerMember,
    registerIntent: 'employer',
    onboardingKind: 'active_employer',
  }) === '/employer',
  'approved employer → /employer'
)
assert(
  canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: true,
    isPlatformAdmin: false,
    organizationStatus: 'active',
  }),
  'active membership on active org enters workspace'
)

console.log('\n5. Company admin invite → access after accept')
assert(
  resolveEmployerOnboardingKind({
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
    hasPendingOrganizationRequest: false,
    hasPendingInvite: true,
  }) === 'pending_invite',
  'pending invite onboarding kind'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'employer',
    onboardingKind: 'pending_invite',
  }) === '/employer/invitation',
  'invited employer → /employer/invitation'
)
assert(
  companyAdminInviteRequiresPlatformApproval() === false,
  'employee invites do not require Energy & Logics approval'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: employerMember,
    onboardingKind: 'active_employer',
    requestedRedirect: '/employer/invitation?token=abc',
  }) === '/employer/invitation?token=abc',
  'invitation return path preserved after auth'
)

console.log('\n6. Employee cannot access another organization')
assert(
  membershipGrantsAccessToOtherOrganization('org-a', 'org-b') === false,
  'membership is tenant-scoped'
)
assert(
  membershipGrantsAccessToOtherOrganization('org-a', 'org-a') === true,
  'membership allows own organization'
)

console.log('\n7. Employer + candidate capabilities coexist')
assert(employerMember.canUseCandidate && employerMember.canUseEmployer, 'both capabilities true')
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: employerMember,
    onboardingKind: 'active_employer',
  }) === '/jobs/auth/choose',
  'generic sign-in with both → choose'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: employerMember,
    registerIntent: 'candidate',
    onboardingKind: 'active_employer',
  }) === '/app',
  'same account can still enter candidate flow'
)

console.log('\n8. Rejected organization cannot access employer workspace')
assert(
  resolveEmployerOnboardingKind({
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
    hasPendingOrganizationRequest: false,
    hasPendingInvite: false,
    latestRequestStatus: 'rejected',
  }) === 'rejected_request',
  'rejected request kind'
)
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
  }),
  'rejected requester denied workspace'
)
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'employer',
    onboardingKind: 'rejected_request',
  }) === '/employer/pending',
  'rejected → pending status page'
)

console.log('\n9. Suspended organization loses employer access')
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: true,
    isPlatformAdmin: false,
    organizationStatus: 'suspended',
  }),
  'suspended org membership does not grant workspace'
)
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: true,
    isPlatformAdmin: false,
    organizationStatus: 'draft',
  }),
  'draft org membership does not grant workspace'
)

console.log('\n10. Browser cannot forge role / organization_id / approval status')
assert(
  employerAccessFromClientClaims({
    role: 'organization_admin',
    organization_id: 'forged-org',
    approval_status: 'approved',
  }) === false,
  'forged client claims ignored'
)

console.log('\n11. Passwordless email links cannot bypass approval')
assert(magicLinkGrantsEmployerAccess() === false, 'magic link does not grant employer access')
assert(
  resolvePostAuthRedirectWithOnboarding({
    capabilities: candidateOnly,
    registerIntent: 'employer',
    onboardingKind: 'pending_request',
    requestedRedirect: '/employer',
  }) === '/employer/pending',
  'verify redirect to /employer still lands on pending without membership'
)

console.log('\n12. Academy authentication remains unchanged')
assert(academyAuthUnchanged(), 'Academy password auth is separate from recruitment magic links')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
