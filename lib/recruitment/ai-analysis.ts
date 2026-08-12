/**
 * Recruitment AI analysis lifecycle — advisory only.
 * Never mutates technical_score, integrity_band, answers, or integrity events.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { completeRecruitmentAi, getRecruitmentAiConfig, publicAiStatus } from '@/lib/recruitment/ai-provider'
import { prepareApplicationAdvisoryInput } from '@/lib/recruitment/ai-prepare'
import {
  advisoryResultSchemaHint,
  RECRUITMENT_AI_INPUT_REFERENCE_VERSION,
  RECRUITMENT_AI_PROMPT_VERSION,
  RECRUITMENT_AI_SYSTEM_PROMPT,
  type AdvisoryResultSchema,
} from '@/lib/recruitment/ai-prompts'

export type RecruitmentAiAnalysisType =
  | 'application_advisory'
  | 'cv_profile_summary'
  | 'open_answer_review'
  | 'technical_performance_summary'
  | 'integrity_context_summary'
  | 'interview_suggestions'

const ANALYSIS_SELECT =
  'id, organization_id, application_id, session_id, answer_id, analysis_type, status, provider, model, prompt_version, input_reference_version, input_digest, result, error_message, requested_by, created_at, started_at, completed_at, updated_at'

function emptyAdvisory(disclaimerExtra?: string): AdvisoryResultSchema {
  return {
    candidateSummary: 'Analysis is not available yet.',
    technicalStrengths: [],
    technicalWeaknesses: [],
    openAnswerObservations: [],
    cvObservations: [],
    suggestedInterviewAreas: [],
    integrityContext: 'No integrity summary generated.',
    limitations: 'AI analysis was unavailable or incomplete.',
    disclaimer:
      disclaimerExtra ||
      'AI-generated analysis is advisory and does not determine hiring decisions.',
  }
}

function parseAdvisoryResult(raw: string | undefined): AdvisoryResultSchema {
  if (!raw) return emptyAdvisory()
  try {
    const parsed = JSON.parse(raw) as Partial<AdvisoryResultSchema>
    return {
      candidateSummary: String(parsed.candidateSummary ?? ''),
      technicalStrengths: Array.isArray(parsed.technicalStrengths)
        ? parsed.technicalStrengths.map(String)
        : [],
      technicalWeaknesses: Array.isArray(parsed.technicalWeaknesses)
        ? parsed.technicalWeaknesses.map(String)
        : [],
      openAnswerObservations: Array.isArray(parsed.openAnswerObservations)
        ? parsed.openAnswerObservations.map(String)
        : [],
      cvObservations: Array.isArray(parsed.cvObservations)
        ? parsed.cvObservations.map(String)
        : [],
      suggestedInterviewAreas: Array.isArray(parsed.suggestedInterviewAreas)
        ? parsed.suggestedInterviewAreas.map(String)
        : [],
      integrityContext: String(parsed.integrityContext ?? ''),
      limitations: String(parsed.limitations ?? 'Advisory analysis only.'),
      disclaimer: String(
        parsed.disclaimer ||
          'AI-generated analysis is advisory and does not determine hiring decisions.'
      ),
    }
  } catch {
    return emptyAdvisory('AI returned an unreadable response. Treat as unavailable.')
  }
}

async function assertApplicationInOrg(organizationId: string, applicationId: string) {
  if (!supabaseAdmin) return { error: 'Database not configured' as const }
  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select('id, job:recruitment_jobs(organization_id)')
    .eq('id', applicationId)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'Application not found' as const }
  const job = Array.isArray(data.job) ? data.job[0] : data.job
  if (!job || String(job.organization_id) !== organizationId) {
    return { error: 'Forbidden' as const }
  }
  return { ok: true as const }
}

/** Explicit invariants for tests and callers. */
export function aiMayOverwriteTechnicalScore(): boolean {
  return false
}
export function aiMayOverwriteIntegrityBand(): boolean {
  return false
}
export function aiMayModifyScreeningAnswers(): boolean {
  return false
}
export function aiMayModifyIntegrityEvents(): boolean {
  return false
}
export function aiIsRequiredForScreeningCompletion(): boolean {
  return false
}
export function candidateMayAccessHrAiAnalysis(): boolean {
  return false
}

export async function listApplicationAiAnalyses(
  organizationId: string,
  applicationId: string
) {
  const access = await assertApplicationInOrg(organizationId, applicationId)
  if ('error' in access) return { error: access.error }

  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_ai_analyses')
    .select(ANALYSIS_SELECT)
    .eq('organization_id', organizationId)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return {
    analyses: data ?? [],
    provider: publicAiStatus(),
  }
}

export async function getApplicationAiAnalysis(
  organizationId: string,
  applicationId: string,
  analysisId: string
) {
  const access = await assertApplicationInOrg(organizationId, applicationId)
  if ('error' in access) return { error: access.error }
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_ai_analyses')
    .select(ANALYSIS_SELECT)
    .eq('id', analysisId)
    .eq('organization_id', organizationId)
    .eq('application_id', applicationId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Analysis not found' }
  return { analysis: data, provider: publicAiStatus() }
}

export async function requestApplicationAdvisoryAnalysis(input: {
  organizationId: string
  applicationId: string
  requestedBy: string
  analysisType?: RecruitmentAiAnalysisType
}) {
  const access = await assertApplicationInOrg(input.organizationId, input.applicationId)
  if ('error' in access) return { error: access.error }
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const analysisType: RecruitmentAiAnalysisType = input.analysisType ?? 'application_advisory'
  const config = getRecruitmentAiConfig()

  const prepared = await prepareApplicationAdvisoryInput({
    organizationId: input.organizationId,
    applicationId: input.applicationId,
  })
  if (prepared.error || !prepared.prepared) {
    return { error: prepared.error || 'Could not prepare analysis input' }
  }

  const now = new Date().toISOString()
  const { data: row, error } = await supabaseAdmin
    .from('recruitment_ai_analyses')
    .insert([
      {
        organization_id: input.organizationId,
        application_id: input.applicationId,
        session_id: prepared.prepared.sessionId,
        analysis_type: analysisType,
        status: 'analyzing',
        provider: config.provider,
        model: config.model,
        prompt_version: RECRUITMENT_AI_PROMPT_VERSION,
        input_reference_version: RECRUITMENT_AI_INPUT_REFERENCE_VERSION,
        input_digest: prepared.prepared.digest,
        result: {},
        requested_by: input.requestedBy,
        started_at: now,
        updated_at: now,
      },
    ])
    .select(ANALYSIS_SELECT)
    .single()

  if (error || !row) {
    return { error: error?.message || 'Could not create analysis record' }
  }

  await writeRecruitmentAudit({
    actorUserId: input.requestedBy,
    organizationId: input.organizationId,
    action: 'ai_analysis_requested',
    entityType: 'recruitment_ai_analyses',
    entityId: row.id,
    metadata: {
      applicationId: input.applicationId,
      analysisType,
      provider: config.provider,
      model: config.model,
      promptVersion: RECRUITMENT_AI_PROMPT_VERSION,
      // never store API keys
    },
  })

  // Process in-process (HR-triggered). Failures mark the row failed — screening unaffected.
  const processed = await processAdvisoryAnalysis({
    analysisId: row.id,
    organizationId: input.organizationId,
    applicationId: input.applicationId,
    preparedUserContent: prepared.prepared.promptUserContent,
    facts: prepared.prepared.facts,
  })

  return { analysis: processed.analysis ?? row, provider: publicAiStatus() }
}

async function processAdvisoryAnalysis(input: {
  analysisId: string
  organizationId: string
  applicationId: string
  preparedUserContent: string
  facts: PreparedFacts
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  // Snapshot authoritative scores before AI — verify unchanged after
  const before = await loadAuthoritativeScores(input.organizationId, input.applicationId)

  const completion = await completeRecruitmentAi(
    [
      { role: 'system', content: RECRUITMENT_AI_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${advisoryResultSchemaHint()}\n\n${input.preparedUserContent}`,
      },
    ],
    { maxTokens: 1400, temperature: 0.2 }
  )

  const now = new Date().toISOString()

  if (!completion.ok || !completion.content) {
    const { data: failed } = await supabaseAdmin
      .from('recruitment_ai_analyses')
      .update({
        status: 'failed',
        error_message: completion.error || 'Analysis failed',
        model: completion.model,
        completed_at: now,
        updated_at: now,
        result: {
          advisory: emptyAdvisory(
            'AI provider unavailable. Hiring workflow can continue without AI.'
          ),
          providerFallback: true,
        },
      })
      .eq('id', input.analysisId)
      .eq('organization_id', input.organizationId)
      .select(ANALYSIS_SELECT)
      .maybeSingle()

    await writeRecruitmentAudit({
      organizationId: input.organizationId,
      action: 'ai_analysis_failed',
      entityType: 'recruitment_ai_analyses',
      entityId: input.analysisId,
      metadata: { error: completion.error || 'failed', model: completion.model },
    })

    await assertScoresUnchanged(before)
    return { analysis: failed, error: completion.error }
  }

  const advisory = parseAdvisoryResult(completion.content)
  // Re-assert platform facts in result (AI must not invent replacements)
  const result = {
    advisory,
    platformFacts: {
      technicalScore: input.facts.technicalScore,
      integrityBand: input.facts.integrityBand,
      passed: input.facts.passed,
      sectionScores: input.facts.sectionScores,
    },
    meta: {
      promptVersion: RECRUITMENT_AI_PROMPT_VERSION,
      inputReferenceVersion: RECRUITMENT_AI_INPUT_REFERENCE_VERSION,
      advisoryOnly: true,
    },
  }

  const { data: available } = await supabaseAdmin
    .from('recruitment_ai_analyses')
    .update({
      status: 'available',
      result,
      model: completion.model,
      error_message: null,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', input.analysisId)
    .eq('organization_id', input.organizationId)
    .select(ANALYSIS_SELECT)
    .maybeSingle()

  await writeRecruitmentAudit({
    organizationId: input.organizationId,
    action: 'ai_analysis_completed',
    entityType: 'recruitment_ai_analyses',
    entityId: input.analysisId,
    metadata: {
      model: completion.model,
      promptVersion: RECRUITMENT_AI_PROMPT_VERSION,
      status: 'available',
    },
  })

  await assertScoresUnchanged(before)
  return { analysis: available }
}

type PreparedFacts = {
  technicalScore: number | null
  sectionScores: Record<string, unknown> | null
  passed: boolean | null
  integrityBand: string | null
  integritySummaryText: string | null
  integrityRecommendation: string | null
  jobTitle: string
  jobRequirements: string | null
}

async function loadAuthoritativeScores(organizationId: string, applicationId: string) {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('id, technical_score, integrity_band')
    .eq('organization_id', organizationId)
    .eq('application_id', applicationId)
    .order('attempt_number', { ascending: false })
    .limit(5)
  return data ?? []
}

async function assertScoresUnchanged(
  before: Array<{ id: string; technical_score: unknown; integrity_band: unknown }> | null
) {
  if (!before?.length || !supabaseAdmin) return
  for (const row of before) {
    const { data } = await supabaseAdmin
      .from('recruitment_screening_sessions')
      .select('technical_score, integrity_band')
      .eq('id', row.id)
      .maybeSingle()
    if (!data) continue
    if (data.technical_score !== row.technical_score || data.integrity_band !== row.integrity_band) {
      // Restore authoritative values — AI path must never persist score changes
      await supabaseAdmin
        .from('recruitment_screening_sessions')
        .update({
          technical_score: row.technical_score,
          integrity_band: row.integrity_band,
        })
        .eq('id', row.id)
      console.error('[recruitment-ai] blocked unauthorized score/band mutation')
    }
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Not analyzed'
    case 'analyzing':
      return 'Analyzing'
    case 'available':
      return 'Analysis available'
    case 'failed':
      return 'Analysis failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}
