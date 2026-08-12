/**
 * Compare candidates for the same job using objective fields only.
 * Does not auto-rank "best hire".
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type CandidateCompareRow = {
  applicationId: string
  candidateUserId: string
  displayName: string
  status: string
  submittedAt: string
  technicalScore: number | null
  integrityBand: string | null
  screeningCompleted: boolean
  screeningStatus: string | null
}

export async function compareJobCandidates(organizationId: string, jobId: string) {
  if (!supabaseAdmin) return { candidates: [], error: 'Database not configured' }

  const { data: job } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id, organization_id, title')
    .eq('id', jobId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (!job) return { candidates: [], error: 'Job not found' }

  const { data: apps, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select('id, candidate_user_id, status, submitted_at, profile_snapshot')
    .eq('job_id', jobId)
    .order('submitted_at', { ascending: false })

  if (error) return { candidates: [], error: error.message }

  const rows: CandidateCompareRow[] = []
  for (const app of apps ?? []) {
    const { data: sessions } = await supabaseAdmin
      .from('recruitment_screening_sessions')
      .select('id, status, technical_score, integrity_band, finalized_at')
      .eq('application_id', app.id)
      .eq('organization_id', organizationId)
      .order('attempt_number', { ascending: false })
      .limit(1)

    const session = sessions?.[0] ?? null
    const snapshot = (app.profile_snapshot ?? {}) as Record<string, unknown>
    rows.push({
      applicationId: app.id,
      candidateUserId: app.candidate_user_id,
      displayName: String(snapshot.full_name || snapshot.headline || 'Candidate'),
      status: app.status,
      submittedAt: app.submitted_at,
      technicalScore: session?.technical_score != null ? Number(session.technical_score) : null,
      integrityBand: session?.integrity_band != null ? String(session.integrity_band) : null,
      screeningCompleted: Boolean(
        session && (session.status === 'submitted' || session.status === 'expired')
      ),
      screeningStatus: session?.status ?? null,
    })
  }

  return {
    job: { id: job.id, title: job.title },
    candidates: rows,
    autoRanked: false,
  }
}
