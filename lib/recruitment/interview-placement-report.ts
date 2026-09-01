/**
 * Interview placement — who sits when and where. No profile text, marks, or notes.
 */

import { getOrganizationById } from '@/lib/recruitment/organizations'
import { listOrganizationInterviews } from '@/lib/recruitment/interviews'
import { loadEmployerLogoDataUrl } from '@/lib/recruitment/employer-report-branding'
import {
  formatInterviewDuration,
  formatInterviewTypeLabel,
  formatInterviewWhenShort,
} from '@/lib/recruitment/interview-format'
import type {
  InterviewPlacementReport,
  InterviewPlacementRow,
} from '@/lib/recruitment/interview-stage-report-types'

function formatPlace(interview: {
  interview_type: string
  location: string | null
}): string {
  const location = String(interview.location || '').trim()
  if (interview.interview_type === 'online') return location || 'Online'
  if (interview.interview_type === 'phone') return location || 'Phone'
  return location || 'In person'
}

function formatStatus(status: string): string {
  return String(status || '').replace(/_/g, ' ')
}

export async function getInterviewPlacementReport(input: {
  organizationId: string
  jobIds?: string[] | null
}): Promise<{ report?: InterviewPlacementReport; error?: string }> {
  const { organization, error: orgError } = await getOrganizationById(input.organizationId)
  if (orgError) return { error: orgError }
  if (!organization) return { error: 'Organization not found' }

  const { interviews, error } = await listOrganizationInterviews({
    organizationId: input.organizationId,
    jobIds: input.jobIds,
  })
  if (error) return { error }

  const rows: InterviewPlacementRow[] = interviews
    .filter((row) => row.status !== 'cancelled')
    .map((interview) => ({
      interviewId: interview.id,
      applicationId: interview.application_id,
      when: formatInterviewWhenShort(interview.scheduled_at, interview.timezone),
      name: interview.candidate_name || 'Candidate',
      jobTitle: interview.job_title || 'Role',
      interviewType: formatInterviewTypeLabel(interview.interview_type),
      place: formatPlace(interview),
      status: formatStatus(interview.status),
      duration: formatInterviewDuration(interview.duration_minutes) || '—',
    }))

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
      rowCount: rows.length,
      rows,
    },
  }
}
