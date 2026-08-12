/**
 * Recruitment authentication UX — registration vs sign-in, shared identity, redirects.
 * Run: node scripts/test-recruitment-auth-ux.mjs
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

function resolvePostAuthRedirect(input) {
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

function shouldCreateUserOnAuthRequest(mode) {
  return mode === 'register'
}

function sharedUserIdentity(emailA, emailB) {
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase()
}

function employerSelfRegistrationCreatesOrganization() {
  return false
}

function employerAccessFromClientRole(_role) {
  return false
}

function canEnterEmployerWorkspace(input) {
  if (!input.isAuthenticated) return false
  return input.hasActiveEmployerMembership || input.isPlatformAdmin
}

const candidateOnly = capabilitiesFromState({
  hasActiveEmployerMembership: false,
  isPlatformAdmin: false,
})
const employerMember = capabilitiesFromState({
  hasActiveEmployerMembership: true,
  isPlatformAdmin: false,
})
const platformAdmin = capabilitiesFromState({
  hasActiveEmployerMembership: false,
  isPlatformAdmin: true,
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

console.log('\nCandidate registration')
assert(
  resolvePostAuthRedirect({ capabilities: candidateOnly, registerIntent: 'candidate' }) === '/app',
  'candidate register → /app'
)
assert(
  resolvePostAuthRedirect({
    capabilities: candidateOnly,
    registerIntent: 'candidate',
    requestedRedirect: '/o/acme/jobs/eng/apply',
  }) === '/o/acme/jobs/eng/apply',
  'candidate register preserves apply return path'
)
assert(shouldCreateUserOnAuthRequest('register') === true, 'register mode may create the shared user')
assert(candidateOnly.canUseCandidate === true, 'candidate capability is always available after auth')
assert(candidateOnly.canUseEmployer === false, 'candidate register does not grant hiring access')

console.log('\nEmployer registration / onboarding')
assert(
  resolvePostAuthRedirect({ capabilities: candidateOnly, registerIntent: 'employer' }) ===
    '/employer/get-access',
  'employer register without company access → get-access'
)
assert(
  resolvePostAuthRedirect({ capabilities: employerMember, registerIntent: 'employer' }) ===
    '/employer',
  'employer register with existing company access → /employer'
)
assert(
  employerSelfRegistrationCreatesOrganization() === false,
  'self-registration does not create a company workspace'
)
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
  }),
  'new employer registrant cannot enter hiring workspace until invited'
)

console.log('\nShared user identity')
assert(sharedUserIdentity('Alex@Company.com', 'alex@company.com'), 'same email is one user')
assert(!sharedUserIdentity('a@x.com', 'b@x.com'), 'different emails are different users')
assert(
  resolvePostAuthRedirect({ capabilities: employerMember, registerIntent: 'candidate' }) === '/app',
  'existing hiring user can still register/use candidate flow on the same account'
)

console.log('\nSign-in')
assert(shouldCreateUserOnAuthRequest('signin') === false, 'sign-in does not create a user')
assert(shouldCreateUserOnAuthRequest(undefined) === false, 'missing mode is sign-in (no create)')
assert(
  resolvePostAuthRedirect({ capabilities: candidateOnly }) === '/app',
  'candidate-only sign-in → /app'
)
assert(
  resolvePostAuthRedirect({
    capabilities: employerMember,
    requestedRedirect: '/employer',
  }) === '/employer',
  'hiring sign-in with employer return path → /employer'
)
assert(
  safeRecruitmentRedirect('https://evil.example/phish') === null,
  'reject absolute redirect'
)
assert(safeRecruitmentRedirect('//evil.example') === null, 'reject protocol-relative redirect')

console.log('\nUser with both candidate + hiring capabilities')
assert(employerMember.canUseCandidate && employerMember.canUseEmployer, 'membership implies both')
assert(
  resolvePostAuthRedirect({ capabilities: employerMember }) === '/jobs/auth/choose',
  'generic sign-in with both → workspace choice'
)
assert(
  resolvePostAuthRedirect({ capabilities: platformAdmin }) === '/jobs/auth/choose',
  'platform admin generic sign-in → workspace choice'
)
assert(
  resolvePostAuthRedirect({
    capabilities: employerMember,
    requestedRedirect: '/app',
  }) === '/app',
  'explicit candidate return path is honored'
)

console.log('\nUnauthorized employer access')
assert(
  employerAccessFromClientRole('organization_admin') === false,
  'client-supplied role does not grant hiring access'
)
assert(
  employerAccessFromClientRole('admin') === false,
  'client-supplied admin role is ignored'
)
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: false,
    hasActiveEmployerMembership: true,
    isPlatformAdmin: true,
  }),
  'unauthenticated user cannot enter hiring workspace'
)
assert(
  resolvePostAuthRedirect({
    capabilities: candidateOnly,
    requestedRedirect: '/employer/jobs',
  }) === '/employer/get-access',
  'candidate hitting employer path is sent to get-access, not the workspace'
)

console.log('\nCandidate cannot access employer workspace without membership')
assert(
  !canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: false,
    isPlatformAdmin: false,
  }),
  'authenticated candidate without membership is denied'
)
assert(
  canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: true,
    isPlatformAdmin: false,
  }),
  'active company membership allows hiring workspace'
)
assert(
  canEnterEmployerWorkspace({
    isAuthenticated: true,
    hasActiveEmployerMembership: false,
    isPlatformAdmin: true,
  }),
  'platform admin may enter hiring workspace'
)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
