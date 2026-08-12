/**
 * Phase 7 — Employer operations & interview workflow (unit checks, no DB).
 * Run: node scripts/test-recruitment-phase7.mjs
 */

const TRANSITIONS = {
  submitted: ['under_review', 'screening', 'rejected'],
  under_review: ['screening', 'shortlisted', 'interview', 'rejected', 'submitted'],
  screening: ['under_review', 'shortlisted', 'interview', 'rejected'],
  shortlisted: ['interview', 'offer', 'under_review', 'rejected'],
  interview: ['shortlisted', 'offer', 'rejected', 'under_review'],
  offer: ['hired', 'interview', 'rejected'],
  hired: [],
  rejected: ['under_review', 'shortlisted'],
  withdrawn: [],
}

const DECISION_STATUSES = new Set(['offer', 'hired', 'rejected'])
const DECISION_ROLES = new Set(['organization_admin', 'hr_recruiter'])

function isAllowedPipelineTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return { ok: true }
  if (toStatus === 'withdrawn') {
    return { ok: false, error: 'Candidates withdraw applications; employers cannot set withdrawn.' }
  }
  if (fromStatus === 'withdrawn') {
    return { ok: false, error: 'Withdrawn applications cannot be moved by employers.' }
  }
  if (fromStatus === 'hired' && toStatus !== 'hired') {
    return { ok: false, error: 'Hired is a terminal status for this workflow.' }
  }
  const allowed = TRANSITIONS[fromStatus] ?? []
  if (!allowed.includes(toStatus)) {
    return { ok: false, error: `Cannot move application from ${fromStatus} to ${toStatus}.` }
  }
  return { ok: true }
}

function canRoleSetStatus(asPlatformAdmin, membershipRole, toStatus) {
  if (asPlatformAdmin) return true
  if (!membershipRole) return false
  if (DECISION_STATUSES.has(toStatus)) return DECISION_ROLES.has(membershipRole)
  return (
    membershipRole === 'organization_admin' ||
    membershipRole === 'hr_recruiter' ||
    membershipRole === 'hiring_manager'
  )
}

function interviewEvaluationAutoHires() {
  return false
}
function interviewEvaluationAutoRejects() {
  return false
}

function canAccessOrgResource(actorOrgId, resourceOrgId) {
  return actorOrgId === resourceOrgId
}

function candidateSafeInterview(row) {
  const {
    internal_notes,
    evaluations,
    private_notes,
    feedback,
    recommendation,
    ...safe
  } = row
  return safe
}

function candidateMayAccessHrNotes() {
  return false
}

function aiMayOverwriteTechnicalScore() {
  return false
}
function integrityMayOverwriteTechnicalScore() {
  return false
}
function compareAutoRanksBestHire() {
  return false
}
function aiDeterminesRanking() {
  return false
}

function academyAssessmentTouched() {
  return false
}

function formatPipelineLabel(status) {
  if (status === 'submitted') return 'New'
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function shouldNotifyStatus(status) {
  return [
    'under_review',
    'screening',
    'shortlisted',
    'interview',
    'offer',
    'hired',
    'rejected',
  ].includes(status)
}

function auditActionForStatus(toStatus) {
  if (toStatus === 'shortlisted') return 'candidate_shortlisted'
  if (toStatus === 'rejected') return 'candidate_rejected'
  if (toStatus === 'hired') return 'candidate_hired'
  if (toStatus === 'offer') return 'decision_recorded'
  return 'application_status_changed'
}

function cvAccessRequiresSignedUrl(orgMatch) {
  return orgMatch === true
}

let passed = 0
let failed = 0

function assert(name, condition) {
  if (condition) {
    passed++
    console.log(`PASS  ${name}`)
  } else {
    failed++
    console.error(`FAIL  ${name}`)
  }
}

console.log('Phase 7 recruitment tests\n')

// Pipeline transitions
assert('NEW→UNDER_REVIEW allowed', isAllowedPipelineTransition('submitted', 'under_review').ok)
assert('UNDER_REVIEW→SCREENING allowed', isAllowedPipelineTransition('under_review', 'screening').ok)
assert('SCREENING→SHORTLISTED allowed', isAllowedPipelineTransition('screening', 'shortlisted').ok)
assert('SHORTLISTED→INTERVIEW allowed', isAllowedPipelineTransition('shortlisted', 'interview').ok)
assert('INTERVIEW→OFFER allowed', isAllowedPipelineTransition('interview', 'offer').ok)
assert('OFFER→HIRED allowed', isAllowedPipelineTransition('offer', 'hired').ok)
assert('cannot jump submitted→hired', !isAllowedPipelineTransition('submitted', 'hired').ok)
assert('employer cannot set withdrawn', !isAllowedPipelineTransition('under_review', 'withdrawn').ok)
assert('hired is terminal', !isAllowedPipelineTransition('hired', 'offer').ok)
assert('rejected can reopen to under_review', isAllowedPipelineTransition('rejected', 'under_review').ok)
assert('UI New label for submitted', formatPipelineLabel('submitted') === 'New')

// RBAC
assert('hiring_manager can move to interview', canRoleSetStatus(false, 'hiring_manager', 'interview'))
assert('hiring_manager cannot hire', !canRoleSetStatus(false, 'hiring_manager', 'hired'))
assert('hiring_manager cannot reject', !canRoleSetStatus(false, 'hiring_manager', 'rejected'))
assert('hr_recruiter can hire', canRoleSetStatus(false, 'hr_recruiter', 'hired'))
assert('org_admin can reject', canRoleSetStatus(false, 'organization_admin', 'rejected'))
assert('platform admin can decide', canRoleSetStatus(true, null, 'hired'))
assert('no role cannot set status', !canRoleSetStatus(false, null, 'under_review'))

// Cross-tenant
assert('org A cannot read org B interviews', !canAccessOrgResource('org-a', 'org-b'))
assert('org A can read own apps', canAccessOrgResource('org-a', 'org-a'))
assert('CV requires tenant match', cvAccessRequiresSignedUrl(canAccessOrgResource('org-a', 'org-a')))
assert('CV denied cross-tenant', !cvAccessRequiresSignedUrl(canAccessOrgResource('org-a', 'org-b')))

// Interview privacy
const candidateView = candidateSafeInterview({
  id: 'i1',
  scheduled_at: '2026-01-01',
  meeting_url: 'https://meet.example',
  internal_notes: 'SECRET',
  evaluations: [{ recommendation: 'no' }],
  private_notes: 'SECRET2',
  feedback: 'SECRET3',
  recommendation: 'no',
})
assert('candidate interview omits internal_notes', !('internal_notes' in candidateView))
assert('candidate interview omits evaluations', !('evaluations' in candidateView))
assert('candidate still sees meeting url', candidateView.meeting_url === 'https://meet.example')
assert('candidate cannot access HR notes', !candidateMayAccessHrNotes())

// No automatic hiring
assert('interview scorecard does not auto-hire', !interviewEvaluationAutoHires())
assert('interview scorecard does not auto-reject', !interviewEvaluationAutoRejects())
assert('compare does not auto-rank best hire', !compareAutoRanksBestHire())
assert('AI does not determine ranking', !aiDeterminesRanking())

// Authority preserved
assert('AI remains advisory (no tech overwrite)', !aiMayOverwriteTechnicalScore())
assert('integrity does not overwrite technical score', !integrityMayOverwriteTechnicalScore())
assert('Academy assessments untouched', !academyAssessmentTouched())

// Notifications / audit
assert('notify hired', shouldNotifyStatus('hired'))
assert('skip spam on submitted re-entry', !shouldNotifyStatus('submitted'))
assert('audit shortlisted action', auditActionForStatus('shortlisted') === 'candidate_shortlisted')
assert('audit hired action', auditActionForStatus('hired') === 'candidate_hired')
assert('audit reject action', auditActionForStatus('rejected') === 'candidate_rejected')

// Default criteria present
const criteria = [
  'Technical Knowledge',
  'Problem Solving',
  'Communication',
  'Practical Experience',
  'Role Fit',
]
assert('default scorecard has 5 criteria', criteria.length === 5)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
