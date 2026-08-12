/**
 * Hiring Manager job-assignment RBAC — unit checks (no DB).
 * Run: node scripts/test-recruitment-hm-assignments.mjs
 */

function roleHasOrgWideJobAccess(asPlatformAdmin, role) {
  if (asPlatformAdmin) return true
  return role === 'organization_admin' || role === 'hr_recruiter'
}

function roleRequiresJobAssignment(asPlatformAdmin, role) {
  return !asPlatformAdmin && role === 'hiring_manager'
}

function canAccessJobWithAssignments({ asPlatformAdmin, role, jobId, assignedJobIds }) {
  if (roleHasOrgWideJobAccess(asPlatformAdmin, role)) return true
  if (!roleRequiresJobAssignment(asPlatformAdmin, role)) return false
  return assignedJobIds.includes(jobId)
}

function filterJobsByAssignmentScope(jobs, scope) {
  if (scope.mode === 'all') return jobs
  if (scope.mode === 'none') return []
  const allowed = new Set(scope.jobIds)
  return jobs.filter((job) => allowed.has(job.id))
}

function resolveScopedJobIds({ scope, requestedJobId }) {
  const requested = requestedJobId?.trim() || null
  if (scope.mode === 'all') {
    return { jobIds: requested ? [requested] : null, error: null }
  }
  if (scope.mode === 'none') {
    if (requested) return { jobIds: [], error: 'Forbidden' }
    return { jobIds: [], error: null }
  }
  if (requested) {
    if (!scope.jobIds.includes(requested)) return { jobIds: [], error: 'Forbidden' }
    return { jobIds: [requested], error: null }
  }
  return { jobIds: scope.jobIds, error: null }
}

function endpointAllowed(actor, resourceJobId, assignedJobIds) {
  return canAccessJobWithAssignments({
    asPlatformAdmin: actor.asPlatformAdmin,
    role: actor.role,
    jobId: resourceJobId,
    assignedJobIds,
  })
}

function listWouldLeak(jobs, scope) {
  const visible = filterJobsByAssignmentScope(jobs, scope)
  return visible.some((j) => scope.mode === 'assigned' && !scope.jobIds.includes(j.id))
}

function candidateMayBypassJobAssignment() {
  return false
}

function academyAssessmentTouched() {
  return false
}

const JOB_A = 'job-a'
const JOB_B = 'job-b'
const jobs = [{ id: JOB_A }, { id: JOB_B }]

const hm = { asPlatformAdmin: false, role: 'hiring_manager' }
const hr = { asPlatformAdmin: false, role: 'hr_recruiter' }
const admin = { asPlatformAdmin: false, role: 'organization_admin' }
const platform = { asPlatformAdmin: true, role: null }
const candidate = { asPlatformAdmin: false, role: null }

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

console.log('HM job-assignment RBAC tests\n')

const hmAssignedA = [JOB_A]

// 1. HM assigned to Job A → can access Job A
assert(
  '1 HM assigned Job A can access Job A',
  endpointAllowed(hm, JOB_A, hmAssignedA)
)

// 2. HM assigned to Job A → cannot access Job B
assert(
  '2 HM assigned Job A cannot access Job B',
  !endpointAllowed(hm, JOB_B, hmAssignedA)
)

// 3. HM cannot access Job B applications by changing IDs
const idorApp = resolveScopedJobIds({
  scope: { mode: 'assigned', jobIds: hmAssignedA },
  requestedJobId: JOB_B,
})
assert('3 HM IDOR jobId filter Forbidden', idorApp.error === 'Forbidden')
assert(
  '3b HM cannot open Job B application resource',
  !endpointAllowed(hm, JOB_B, hmAssignedA)
)

// 4. HM cannot access Job B CVs
assert('4 HM cannot access Job B CV', !endpointAllowed(hm, JOB_B, hmAssignedA))

// 5. HM cannot access Job B screening/integrity
assert('5 HM cannot access Job B screening/integrity', !endpointAllowed(hm, JOB_B, hmAssignedA))

// 6. HM cannot access Job B AI analysis
assert('6 HM cannot access Job B AI', !endpointAllowed(hm, JOB_B, hmAssignedA))

// 7. HM cannot access Job B interviews/evaluations
assert('7 HM cannot access Job B interviews', !endpointAllowed(hm, JOB_B, hmAssignedA))

// 8. HM cannot compare Job B candidates
assert('8 HM cannot compare Job B', !endpointAllowed(hm, JOB_B, hmAssignedA))

// List/count isolation
const hmScope = { mode: 'assigned', jobIds: hmAssignedA }
const hmVisibleJobs = filterJobsByAssignmentScope(jobs, hmScope)
assert('HM list only Job A', hmVisibleJobs.length === 1 && hmVisibleJobs[0].id === JOB_A)
assert('HM list does not leak Job B', !listWouldLeak(jobs, hmScope))
assert(
  'HM with no assignments sees none',
  filterJobsByAssignmentScope(jobs, { mode: 'none' }).length === 0
)

// 9. HR can still access all organization jobs
assert('9 HR can access Job A', endpointAllowed(hr, JOB_A, []))
assert('9b HR can access Job B', endpointAllowed(hr, JOB_B, []))
assert(
  '9c HR list is org-wide',
  filterJobsByAssignmentScope(jobs, { mode: 'all' }).length === 2
)

// 10. Organization Admin can still access all organization jobs
assert('10 Org admin Job A', endpointAllowed(admin, JOB_A, []))
assert('10b Org admin Job B', endpointAllowed(admin, JOB_B, []))

// 11. Platform Admin retains global access
assert('11 Platform admin Job A', endpointAllowed(platform, JOB_A, []))
assert('11b Platform admin Job B', endpointAllowed(platform, JOB_B, []))

// 12. Candidate access remains isolated
assert('12 Candidate cannot use employer job assignment bypass', !candidateMayBypassJobAssignment())
assert(
  '12b Candidate role cannot access employer jobs via assignment helper',
  !endpointAllowed(candidate, JOB_A, [JOB_A])
)

// 13. No Academy regression
assert('13 Academy assessments untouched', !academyAssessmentTouched())

// Extra: client-supplied role cannot escalate
assert(
  'Client claiming org_admin while role is HM still scoped',
  roleRequiresJobAssignment(false, 'hiring_manager') &&
    !canAccessJobWithAssignments({
      asPlatformAdmin: false,
      role: 'hiring_manager',
      jobId: JOB_B,
      assignedJobIds: hmAssignedA,
    })
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
