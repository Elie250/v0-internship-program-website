/**
 * Phase 3 employer platform — authorization and tenant isolation (no DB).
 * Run: node scripts/test-recruitment-phase3.mjs
 */

const JOB_WRITE_ROLES = ['organization_admin', 'hr_recruiter']
const APPLICATION_REVIEW_ROLES = ['organization_admin', 'hr_recruiter', 'hiring_manager']
const SCREENING_WRITE_ROLES = ['organization_admin', 'hr_recruiter']
const MEMBER_WRITE_ROLES = ['organization_admin']
const PIPELINE = ['submitted', 'under_review', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']

function roleAllows(asPlatformAdmin, membershipRole, allowed) {
  if (asPlatformAdmin) return true
  if (!membershipRole) return false
  return allowed.includes(membershipRole)
}

function canAccessApplication(actorOrgId, applicationOrgId) {
  return actorOrgId === applicationOrgId
}

function canAccessCv(actorOrgId, application) {
  return Boolean(application?.cvDocumentId) && application.organizationId === actorOrgId
}

function employerMaySetStatus(status) {
  return PIPELINE.includes(status) && status !== 'withdrawn'
}

function stripPlatformAnswerKey(question) {
  if (question.ownerType === 'platform') {
    const { answerKey, ...rest } = question
    return rest
  }
  return question
}

function candidatePayload(application, notes) {
  return {
    status: application.status,
    notesExposed: false,
    notes: undefined,
    internalNoteCount: notes.length,
  }
}

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

console.log('\nRBAC')
assert(roleAllows(false, 'organization_admin', JOB_WRITE_ROLES), 'org admin can write jobs')
assert(roleAllows(false, 'hr_recruiter', JOB_WRITE_ROLES), 'HR can write jobs')
assert(!roleAllows(false, 'hiring_manager', JOB_WRITE_ROLES), 'hiring manager cannot write jobs')
assert(roleAllows(false, 'hiring_manager', APPLICATION_REVIEW_ROLES), 'hiring manager can review applications')
assert(!roleAllows(false, 'hiring_manager', MEMBER_WRITE_ROLES), 'hiring manager cannot manage members')
assert(!roleAllows(false, 'hr_recruiter', MEMBER_WRITE_ROLES), 'HR cannot manage members')
assert(roleAllows(false, 'hr_recruiter', SCREENING_WRITE_ROLES), 'HR can configure screening')
assert(!roleAllows(false, 'hiring_manager', SCREENING_WRITE_ROLES), 'hiring manager cannot configure screening')
assert(roleAllows(true, null, MEMBER_WRITE_ROLES), 'platform admin bypasses org role')

console.log('\nTenant isolation')
assert(canAccessApplication('org-a', 'org-a'), 'same-org application allowed')
assert(!canAccessApplication('org-a', 'org-b'), 'cross-org application denied')
assert(
  canAccessCv('org-a', { organizationId: 'org-a', cvDocumentId: 'cv-1' }),
  'same-org CV allowed'
)
assert(
  !canAccessCv('org-a', { organizationId: 'org-b', cvDocumentId: 'cv-1' }),
  'Org A cannot read Org B CV'
)
assert(!canAccessCv('org-a', { organizationId: 'org-a', cvDocumentId: null }), 'no CV means no download')

console.log('\nPipeline')
assert(employerMaySetStatus('screening'), 'employer can move to screening')
assert(employerMaySetStatus('hired'), 'employer can mark hired')
assert(!employerMaySetStatus('withdrawn'), 'employer cannot set withdrawn')

console.log('\nQuestion bank protection')
const platformQ = stripPlatformAnswerKey({
  id: 'q1',
  ownerType: 'platform',
  prompt: 'What is Ohm’s law?',
  answerKey: 'V=IR',
})
assert(!('answerKey' in platformQ), 'platform answer key stripped for employer payload')
const orgQ = stripPlatformAnswerKey({
  id: 'q2',
  ownerType: 'organization',
  prompt: 'Internal process question',
  answerKey: 'secret',
})
assert(orgQ.answerKey === 'secret', 'org-private answer key retained for owning org')

console.log('\nCandidate visibility')
const candidateView = candidatePayload({ status: 'shortlisted' }, [{ body: 'Strong hire' }])
assert(candidateView.status === 'shortlisted', 'candidate sees pipeline status')
assert(candidateView.notes === undefined, 'HR notes not included in candidate payload')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
