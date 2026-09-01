/**
 * Internal interview-stage candidate report for employer organizations.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'
import { integrityBandSummary, isIntegrityBand } from '@/lib/integrity/types'
import { loadEmployerLogoDataUrl } from '@/lib/recruitment/employer-report-branding'
import { summarizeSubmittedScorecards } from '@/lib/recruitment/interview-scorecard-summary'
import type {
  InterviewStageReport,
  InterviewStageReportCandidate,
} from '@/lib/recruitment/interview-stage-report-types'

export type { InterviewStageReport, InterviewStageReportCandidate }

function asText(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text || null
}

function formatSectionScores(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const parts: string[] = []
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const percent =
      value && typeof value === 'object' && 'percent' in value
        ? Number((value as { percent?: unknown }).percent)
        : Number(value)
    if (!Number.isFinite(percent)) continue
    parts.push(`${key.replace(/_/g, ' ')} ${Math.round(percent)}%`)
  }
  return parts.length ? parts.join(' · ') : null
}

function formatDescription(snapshot: Record<string, unknown>): string {
  const headline = asText(snapshot.headline)
  const summary = asText(snapshot.summary)
  const skills = Array.isArray(snapshot.skills)
    ? snapshot.skills.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : []
  const bits = [headline, summary, skills.length ? `Skills: ${skills.join(', ')}` : null].filter(
    Boolean
  ) as string[]
  const text = bits.join(' — ')
  return text.length > 420 ? `${text.slice(0, 417)}…` : text || 'No profile description on file.'
}

function formatIntegrityNote(band: string | null, summary: unknown): string {
  const fromBand = band && isIntegrityBand(band) ? integrityBandSummary(band, 'talent') : ''
  const record = summary && typeof summary === 'object' ? (summary as Record<string, unknown>) : {}
  const extra = asText(record.headline) || asText(record.summary)
  if (fromBand && extra && extra !== fromBand) return `${fromBand} ${extra}`
  return fromBand || extra || (band ? `Band: ${band}` : 'No screening integrity recorded.')
}


export async function getInterviewStageReport(input: {
  organizationId: string
  jobIds?: string[] | null
}): Promise<{ report?: InterviewStageReport; error?: string }> {
  const { organization, error: orgError } = await getOrganizationById(input.organizationId)
  if (orgError) return { error: orgError }
  if (!organization) return { error: 'Organization not found' }

  const { applications, error } = await listOrganizationApplications({
    organizationId: input.organizationId,
    jobIds: input.jobIds,
    status: 'interview',
  })
  if (error) return { error }

  const applicationIds = applications.map((row) => row.id)
  const latestByApp = new Map<
    string,
    {
      technical_score: number | null
      section_scores: unknown
      passed: boolean | null
      integrity_band: string | null
      integrity_summary: unknown
    }
  >()

  if (supabaseAdmin && applicationIds.length > 0) {
    const { data: sessions } = await supabaseAdmin
      .from('recruitment_screening_sessions')
      .select(
        'application_id, technical_score, section_scores, passed, integrity_band, integrity_summary, attempt_number, started_at'
      )
      .eq('organization_id', input.organizationId)
      .in('application_id', applicationIds)
      .order('attempt_number', { ascending: false })

    for (const session of sessions ?? []) {
      const appId = String(session.application_id)
      if (latestByApp.has(appId)) continue
      latestByApp.set(appId, {
        technical_score: session.technical_score != null ? Number(session.technical_score) : null,
        section_scores: session.section_scores,
        passed: session.passed == null ? null : Boolean(session.passed),
        integrity_band: session.integrity_band != null ? String(session.integrity_band) : null,
        integrity_summary: session.integrity_summary,
      })
    }
  }

  const scorecardsByApp = new Map<string, ReturnType<typeof summarizeSubmittedScorecards>>()
  if (supabaseAdmin && applicationIds.length > 0) {
    const { data: evaluations } = await supabaseAdmin
      .from('recruitment_interview_evaluations')
      .select('application_id, criteria_scores, overall_rating, recommendation, feedback, status')
      .eq('organization_id', input.organizationId)
      .in('application_id', applicationIds)
      .eq('status', 'submitted')

    const grouped = new Map<string, NonNullable<typeof evaluations>>()
    for (const evaluation of evaluations ?? []) {
      const appId = String(evaluation.application_id)
      const list = grouped.get(appId) ?? []
      list.push(evaluation)
      grouped.set(appId, list)
    }
    for (const [appId, list] of grouped) {
      scorecardsByApp.set(appId, summarizeSubmittedScorecards(list))
    }
  }

  const candidates: InterviewStageReportCandidate[] = applications.map((row) => {
    const snapshot = (row.profile_snapshot ?? {}) as Record<string, unknown>
    const job = Array.isArray(row.job) ? row.job[0] : row.job
    const session = latestByApp.get(row.id)
    const score = session?.technical_score ?? null
    const sections = formatSectionScores(session?.section_scores)
    const passedLabel =
      session?.passed == null ? null : session.passed ? 'Passed threshold' : 'Below threshold'
    const screeningLabel = [
      score != null && Number.isFinite(score) ? `${Math.round(score)}%` : null,
      passedLabel,
      sections,
    ]
      .filter(Boolean)
      .join(' · ') || 'No screening score yet'

    return {
      applicationId: row.id,
      name: asText(snapshot.full_name) || 'Candidate',
      email: asText(snapshot.email) || '',
      phone: asText(snapshot.phone),
      location: asText(snapshot.location),
      headline: asText(snapshot.headline),
      summary: asText(snapshot.summary),
      description: formatDescription(snapshot),
      skills: Array.isArray(snapshot.skills)
        ? snapshot.skills.map((item) => String(item).trim()).filter(Boolean)
        : [],
      jobTitle: job?.title || 'Role',
      submittedAt: row.submitted_at,
      technicalScore: score,
      passed: session?.passed ?? null,
      screeningLabel,
      integrityBand: session?.integrity_band ?? row.latestIntegrityBand ?? null,
      integrityNote: formatIntegrityNote(
        session?.integrity_band ?? row.latestIntegrityBand ?? null,
        session?.integrity_summary
      ),
      interviewMarksLabel: scorecardsByApp.get(row.id)?.marksLabel || 'No submitted interview marks',
    }
  })

  return {
    report: {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logo_url,
        logoDataUrl: await loadEmployerLogoDataUrl(organization.logo_url),
        description: organization.description,
      },
      generatedAt: new Date().toISOString(),
      candidateCount: candidates.length,
      candidates,
    },
  }
}
