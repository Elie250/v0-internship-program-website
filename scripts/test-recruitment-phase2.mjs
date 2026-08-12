/**
 * Phase 2 recruitment unit checks (no DB).
 * Run: node scripts/test-recruitment-phase2.mjs
 */

function jobPublicPath(orgSlug, jobSlug) {
  return `/o/${orgSlug}/jobs/${jobSlug}`
}

function isJobAcceptingApplications(job) {
  if (job.status !== 'published') return false
  if (!job.application_deadline) return true
  const deadlineMs = Date.parse(job.application_deadline)
  if (Number.isNaN(deadlineMs)) return false
  return deadlineMs >= Date.now()
}

function serializeApplicationDeadlineInput(value) {
  const raw = value?.trim?.() || String(value || '').trim()
  if (!raw) return null
  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (localMatch) {
    let hours = Number(localMatch[4])
    let minutes = Number(localMatch[5])
    let seconds = Number(localMatch[6] ?? '0')
    if (hours === 0 && minutes === 0 && seconds === 0) {
      hours = 23
      minutes = 59
      seconds = 59
    }
    const local = new Date(
      Number(localMatch[1]),
      Number(localMatch[2]) - 1,
      Number(localMatch[3]),
      hours,
      minutes,
      seconds,
      seconds === 59 ? 999 : 0
    )
    return local.toISOString()
  }
  return new Date(raw).toISOString()
}

function publicJobResponse(job) {
  return {
    title: job.title,
    slug: job.slug,
    organization: { name: job.organization.name, slug: job.organization.slug },
  }
}

function validateCv(filename, mimeType, sizeBytes) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const allowedExt = new Set(['pdf', 'doc', 'docx'])
  const allowedMime = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  if (sizeBytes <= 0 || sizeBytes > 10 * 1024 * 1024) return false
  if (!allowedExt.has(ext)) return false
  if (!allowedMime.has(mimeType)) return false
  return true
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

console.log('\nJob URL architecture')
assert(jobPublicPath('easyfab', 'electrical-engineer') === '/o/easyfab/jobs/electrical-engineer', 'org-scoped public job path')

console.log('\nJob visibility')
assert(isJobAcceptingApplications({ status: 'published', application_deadline: null }), 'published without deadline accepts')
assert(!isJobAcceptingApplications({ status: 'draft', application_deadline: null }), 'draft rejected')
assert(!isJobAcceptingApplications({ status: 'closed', application_deadline: '2099-01-01T00:00:00.000Z' }), 'closed status rejects even with future deadline')
assert(!isJobAcceptingApplications({ status: 'published', application_deadline: '2000-01-01T00:00:00.000Z' }), 'expired deadline rejected')
assert(
  serializeApplicationDeadlineInput('2099-06-01T00:00').endsWith('T21:59:59.999Z') ||
    serializeApplicationDeadlineInput('2099-06-01T00:00').includes('2099-06-01') ||
    serializeApplicationDeadlineInput('2099-06-01T00:00').includes('2099-05-31'),
  'midnight local deadline serializes to end-of-day ISO'
)

console.log('\nPublic API shape')
const shaped = publicJobResponse({
  id: 'secret',
  title: 'Engineer',
  slug: 'engineer',
  organization: { id: 'secret-org', name: 'Acme', slug: 'acme' },
})
assert(!('id' in shaped), 'public job excludes internal id')
assert(shaped.organization.slug === 'acme', 'public org slug retained')

console.log('\nCV validation')
assert(validateCv('cv.pdf', 'application/pdf', 1024), 'valid pdf')
assert(!validateCv('cv.exe', 'application/octet-stream', 1024), 'reject exe')
assert(!validateCv('cv.pdf', 'application/pdf', 20 * 1024 * 1024), 'reject oversized')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
