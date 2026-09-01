/**
 * Short interview-stage list for staff. Name, role, screening %, integrity band only.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'
import { loadEmployerLogoDataUrl } from '@/lib/recruitment/employer-report-branding'
import { identityFromSnapshotAndUser } from '@/lib/recruitment/candidate-identity'
import type {
  InterviewStageReport,
  InterviewStageReportCandidate,
} from '@/lib/recruitment/interview-stage-report-types'

export type { InterviewStageReport, InterviewStageReportCandidate }

function formatIntegrityLabel(band: string | null): string {
  if (!band) return '—'
  const labels: Record<string, string> = {
    NORMAL: 'Normal',
    LOW_CONCERN: 'Low concern',
    REVIEW: 'Review',
    HIGH_CONCERN: 'High concern',
  }
  return labels[band] || band.replace(/_/g, ' ')
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
  const latestByApp = new Map<string, { technical_score: number | null; integrity_band: string | null }>()

  if (supabaseAdmin && applicationIds.length > 0) {
    const { data: sessions } = await supabaseAdmin
      .from('recruitment_screening_sessions')
      .select('application_id, technical_score, integrity_band, attempt_number')
      .eq('organization_id', input.organizationId)
      .in('application_id', applicationIds)
      .order('attempt_number', { ascending: false })

    for (const session of sessions ?? []) {
      const appId = String(session.application_id)
      if (latestByApp.has(appId)) continue
      latestByApp.set(appId, {
        technical_score: session.technical_score != null ? Number(session.technical_score) : null,
        integrity_band: session.integrity_band != null ? String(session.integrity_band) : null,
      })
    }
  }

  const candidates: InterviewStageReportCandidate[] = applications.map((row) => {
    const snapshot = (row.profile_snapshot ?? {}) as Record<string, unknown>
    const job = Array.isArray(row.job) ? row.job[0] : row.job
    const session = latestByApp.get(row.id)
    const score = session?.technical_score ?? null
    const identity = identityFromSnapshotAndUser(snapshot)

    return {
      applicationId: row.id,
      name: identity.name,
      jobTitle: job?.title || 'Role',
      screeningLabel:
        score != null && Number.isFinite(score) ? `${Math.round(score)}%` : '—',
      integrityLabel: formatIntegrityLabel(
        session?.integrity_band ?? row.latestIntegrityBand ?? null
      ),
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
