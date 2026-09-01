/**
 * Internal interview results — scorecard marks per candidate.
 * Advisory only; never includes private interviewer notes.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { listOrganizationInterviews } from '@/lib/recruitment/interviews'
import { loadEmployerLogoDataUrl } from '@/lib/recruitment/employer-report-branding'
import { summarizeSubmittedScorecards } from '@/lib/recruitment/interview-scorecard-summary'
import { formatInterviewTypeLabel, formatInterviewWhen } from '@/lib/recruitment/interview-format'
import { DEFAULT_INTERVIEW_CRITERIA } from '@/lib/recruitment/interview-constants'
import type { InterviewResultsReport, InterviewResultsRow } from '@/lib/recruitment/interview-stage-report-types'

export async function getInterviewResultsReport(input: {
  organizationId: string
  jobIds?: string[] | null
}): Promise<{ report?: InterviewResultsReport; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { organization, error: orgError } = await getOrganizationById(input.organizationId)
  if (orgError) return { error: orgError }
  if (!organization) return { error: 'Organization not found' }

  const { interviews, error } = await listOrganizationInterviews({
    organizationId: input.organizationId,
    jobIds: input.jobIds,
  })
  if (error) return { error }

  const active = interviews.filter((row) => row.status !== 'cancelled')
  const applicationIds = Array.from(new Set(active.map((row) => row.application_id)))
  const interviewIds = active.map((row) => row.id)

  const snapshotByApp = new Map<string, Record<string, unknown>>()
  const jobTitleByApp = new Map<string, string>()
  if (applicationIds.length > 0) {
    const { data: applications } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, profile_snapshot, job:recruitment_jobs(title)')
      .in('id', applicationIds)
    for (const row of applications ?? []) {
      snapshotByApp.set(String(row.id), (row.profile_snapshot ?? {}) as Record<string, unknown>)
      const job = Array.isArray(row.job) ? row.job[0] : row.job
      jobTitleByApp.set(String(row.id), String(job?.title || 'Role'))
    }
  }

  const evaluationsByInterview = new Map<string, Array<Record<string, unknown>>>()
  if (interviewIds.length > 0) {
    const { data: evaluations } = await supabaseAdmin
      .from('recruitment_interview_evaluations')
      .select('interview_id, criteria_scores, overall_rating, recommendation, feedback, status')
      .eq('organization_id', input.organizationId)
      .in('interview_id', interviewIds)

    for (const evaluation of evaluations ?? []) {
      const interviewId = String(evaluation.interview_id)
      const list = evaluationsByInterview.get(interviewId) ?? []
      list.push(evaluation as Record<string, unknown>)
      evaluationsByInterview.set(interviewId, list)
    }
  }

  const criteria = new Set<string>(DEFAULT_INTERVIEW_CRITERIA)
  const rows: InterviewResultsRow[] = active.map((interview) => {
    const snapshot = snapshotByApp.get(interview.application_id) ?? {}
    const summary = summarizeSubmittedScorecards(evaluationsByInterview.get(interview.id) ?? [])
    for (const mark of summary.criteriaMarks) criteria.add(mark.criterion)
    const name = String(snapshot.full_name || '').trim() || 'Candidate'
    const email = String(snapshot.email || '').trim()

    return {
      interviewId: interview.id,
      applicationId: interview.application_id,
      name,
      email,
      jobTitle: jobTitleByApp.get(interview.application_id) || 'Role',
      interviewType: formatInterviewTypeLabel(interview.interview_type),
      interviewStatus: String(interview.status || '').replace(/_/g, ' '),
      scheduledAt: formatInterviewWhen(interview.scheduled_at, interview.timezone),
      criteriaMarks: summary.criteriaMarks,
      marksLabel: summary.marksLabel,
      overallRating: summary.overallRating,
      overallLabel: summary.overallLabel,
      recommendation: summary.recommendation,
      recommendationLabel: summary.recommendationLabel,
      scorecardCount: summary.scorecardCount,
      feedback: summary.feedback,
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
      criteria: Array.from(criteria),
      rowCount: rows.length,
      rows,
    },
  }
}
