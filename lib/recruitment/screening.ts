import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationJob } from '@/lib/recruitment/jobs'
import {
  isRecruitmentQuestionDifficulty,
  type RecruitmentAttemptPolicy,
  type RecruitmentQuestionSelection,
} from '@/lib/recruitment/types'

const CONFIG_SELECT =
  'id, job_id, organization_id, enabled, duration_minutes, question_count, categories, difficulty_distribution, passing_score, passing_criteria, attempt_policy, question_selection, randomized, dynamic_parameters, per_question_time_seconds, integrity_monitoring, status, published_at, section_minimums, max_attempts, created_at, updated_at'

function isAttemptPolicy(value: string): value is RecruitmentAttemptPolicy {
  return value === 'single' || value === 'retry_once' || value === 'unlimited'
}

function isQuestionSelection(value: string): value is RecruitmentQuestionSelection {
  return value === 'manual' || value === 'random_from_bank' || value === 'mixed'
}

export async function getJobScreeningConfig(jobId: string, organizationId: string) {
  if (!supabaseAdmin) return { config: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_screening_configs')
    .select(CONFIG_SELECT)
    .eq('job_id', jobId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) return { config: null, error: error.message }
  return { config: data ?? null }
}

export async function upsertJobScreeningConfig(input: {
  jobId: string
  organizationId: string
  actorUserId: string
  enabled?: boolean
  durationMinutes?: number | null
  questionCount?: number | null
  categories?: string[]
  difficultyDistribution?: Record<string, number>
  passingScore?: number | null
  passingCriteria?: string | null
  attemptPolicy?: string
  questionSelection?: string
  randomized?: boolean
  dynamicParameters?: boolean
  perQuestionTimeSeconds?: number | null
  integrityMonitoring?: boolean
  status?: 'draft' | 'published'
  sectionMinimums?: Record<string, number>
  maxAttempts?: number | null
  publish?: boolean
  /** When publishing, ensure at least this many attached questions (checked after items update if provided). */
  attachedQuestionCount?: number | null
}): Promise<{ config?: Record<string, unknown>; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { job, error: jobError } = await getOrganizationJob(input.jobId, input.organizationId)
  if (jobError) return { error: jobError }
  if (!job) return { error: 'Job not found' }

  const attemptPolicy = input.attemptPolicy && isAttemptPolicy(input.attemptPolicy)
    ? input.attemptPolicy
    : 'single'
  const questionSelection =
    input.questionSelection && isQuestionSelection(input.questionSelection)
      ? input.questionSelection
      : 'manual'

  const publish = Boolean(input.publish) || input.status === 'published'
  const unpublish = input.status === 'draft' && !publish
  const now = new Date().toISOString()

  const { config: existing } = await getJobScreeningConfig(input.jobId, input.organizationId)

  if (publish) {
    let attached = input.attachedQuestionCount
    if (attached == null) {
      const { items } = await listJobScreeningItems(input.jobId, input.organizationId)
      attached = items?.length ?? 0
    }
    if (!attached || attached < 1) {
      return {
        error:
          'Attach at least one question before publishing the assessment. Create questions in the question bank, then select them here.',
      }
    }
  }

  const payload: Record<string, unknown> = {
    job_id: input.jobId,
    organization_id: input.organizationId,
    enabled: Boolean(input.enabled),
    duration_minutes: input.durationMinutes ?? null,
    question_count: input.questionCount ?? null,
    categories: Array.isArray(input.categories) ? input.categories : [],
    difficulty_distribution: input.difficultyDistribution ?? {},
    passing_score: input.passingScore ?? null,
    passing_criteria: input.passingCriteria?.trim() || null,
    attempt_policy: attemptPolicy,
    question_selection: questionSelection,
    randomized: input.randomized !== false,
    dynamic_parameters: Boolean(input.dynamicParameters),
    per_question_time_seconds: input.perQuestionTimeSeconds ?? null,
    integrity_monitoring: Boolean(input.integrityMonitoring),
    section_minimums:
      input.sectionMinimums && typeof input.sectionMinimums === 'object'
        ? input.sectionMinimums
        : (existing?.section_minimums ?? {}),
    max_attempts: input.maxAttempts ?? existing?.max_attempts ?? null,
    status: publish
      ? 'published'
      : unpublish
        ? 'draft'
        : input.status === 'draft'
          ? 'draft'
          : (existing?.status ?? 'draft'),
    published_at: publish ? now : unpublish ? null : existing?.published_at ?? null,
    updated_at: now,
  }

  if (publish) {
    payload.enabled = true
  }
  if (unpublish) {
    payload.enabled = false
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_screening_configs')
    .upsert([payload], { onConflict: 'job_id' })
    .select(CONFIG_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: publish ? 'screening_published' : 'screening_config_updated',
    entityType: 'recruitment_screening_configs',
    entityId: data.id,
    metadata: { jobId: input.jobId, enabled: data.enabled, status: data.status },
  })

  return { config: data as Record<string, unknown> }
}

export async function listJobScreeningItems(jobId: string, organizationId: string) {
  if (!supabaseAdmin) return { items: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_job_screening_items')
    .select(
      'id, job_id, organization_id, question_id, sort_order, created_at, question:recruitment_questions(id, owner_type, organization_id, discipline, difficulty, prompt, expected_time_seconds)'
    )
    .eq('job_id', jobId)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
  if (error) return { items: [], error: error.message }
  return { items: data ?? [] }
}

export async function setJobScreeningItems(input: {
  jobId: string
  organizationId: string
  actorUserId: string
  questionIds: string[]
}): Promise<{ items?: unknown[]; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { job } = await getOrganizationJob(input.jobId, input.organizationId)
  if (!job) return { error: 'Job not found' }

  const uniqueIds = Array.from(new Set(input.questionIds.filter(Boolean))).slice(0, 100)

  if (uniqueIds.length > 0) {
    const { data: questions, error: qError } = await supabaseAdmin
      .from('recruitment_questions')
      .select('id, owner_type, organization_id')
      .in('id', uniqueIds)
    if (qError) return { error: qError.message }
    const allowed = (questions ?? []).filter(
      (q) =>
        q.owner_type === 'platform' ||
        (q.owner_type === 'organization' && q.organization_id === input.organizationId)
    )
    if (allowed.length !== uniqueIds.length) {
      return { error: 'One or more questions are not available to this organization.' }
    }
  }

  await supabaseAdmin
    .from('recruitment_job_screening_items')
    .delete()
    .eq('job_id', input.jobId)
    .eq('organization_id', input.organizationId)

  if (uniqueIds.length > 0) {
    const { error } = await supabaseAdmin.from('recruitment_job_screening_items').insert(
      uniqueIds.map((questionId, index) => ({
        job_id: input.jobId,
        organization_id: input.organizationId,
        question_id: questionId,
        sort_order: index,
      }))
    )
    if (error) return { error: error.message }
  }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'screening_items_updated',
    entityType: 'recruitment_jobs',
    entityId: input.jobId,
    metadata: { questionCount: uniqueIds.length },
  })

  return listJobScreeningItems(input.jobId, input.organizationId)
}

export function isRecruitmentQuestionDifficultyValue(value: string) {
  return isRecruitmentQuestionDifficulty(value)
}
