import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationJob } from '@/lib/recruitment/jobs'
import {
  isRecruitmentQuestionDifficulty,
  type RecruitmentAttemptPolicy,
  type RecruitmentQuestionSelection,
} from '@/lib/recruitment/types'
import {
  DEFAULT_QUESTION_TYPE_MIX,
  normalizeQuestionTypeMix,
  type QuestionTypeMix,
} from '@/lib/recruitment/question-type-mix'

const CONFIG_SELECT =
  'id, job_id, organization_id, enabled, duration_minutes, question_count, categories, difficulty_distribution, question_type_mix, passing_score, passing_criteria, candidate_instructions, attempt_policy, question_selection, randomized, dynamic_parameters, per_question_time_seconds, integrity_monitoring, status, published_at, section_minimums, max_attempts, created_at, updated_at'

const OPTIONAL_CONFIG_COLUMNS = ['question_type_mix', 'candidate_instructions'] as const

const INSTRUCTIONS_SCHEMA_ERROR =
  'Pre-instructions did not save. In Supabase SQL Editor run scripts/84-recruitment-assessment-instructions.sql, then save again. That script adds the column and reloads the API schema.'

function missingOptionalColumn(message: string, column: string) {
  return new RegExp(column, 'i').test(message)
}

export function sanitizeCandidateInstructions(raw: unknown): string | null {
  const text = String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (!text) return null
  return text.slice(0, 8000)
}

function isAttemptPolicy(value: string): value is RecruitmentAttemptPolicy {
  return value === 'single' || value === 'retry_once' || value === 'unlimited'
}

function isQuestionSelection(value: string): value is RecruitmentQuestionSelection {
  return value === 'manual' || value === 'random_from_bank' || value === 'mixed'
}

export async function getJobScreeningConfig(
  jobId: string,
  organizationId: string
): Promise<{ config: Record<string, unknown> | null; error?: string }> {
  if (!supabaseAdmin) return { config: null, error: 'Database not configured' }
  const primary = await supabaseAdmin
    .from('recruitment_screening_configs')
    .select(CONFIG_SELECT)
    .eq('job_id', jobId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!primary.error) {
    const row = primary.data as Record<string, unknown> | null
    if (!row) return { config: null }
    return {
      config: {
        ...row,
        question_type_mix: normalizeQuestionTypeMix(row.question_type_mix),
        candidate_instructions: sanitizeCandidateInstructions(row.candidate_instructions),
      },
    }
  }

  // Pre-migration fallback if optional columns are missing
  if (OPTIONAL_CONFIG_COLUMNS.some((col) => missingOptionalColumn(primary.error.message, col))) {
    let fallbackSelect = CONFIG_SELECT
    for (const col of OPTIONAL_CONFIG_COLUMNS) {
      if (new RegExp(col, 'i').test(primary.error.message)) {
        fallbackSelect = fallbackSelect.replace(`, ${col}`, '')
      }
    }
    const fallback = await supabaseAdmin
      .from('recruitment_screening_configs')
      .select(fallbackSelect)
      .eq('job_id', jobId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (fallback.error) return { config: null, error: fallback.error.message }
    if (!fallback.data) return { config: null }
    const row = fallback.data as unknown as Record<string, unknown>
    const instructionsMissing = missingOptionalColumn(primary.error.message, 'candidate_instructions')
    return {
      config: {
        ...row,
        question_type_mix: normalizeQuestionTypeMix(row.question_type_mix ?? DEFAULT_QUESTION_TYPE_MIX),
        candidate_instructions: sanitizeCandidateInstructions(row.candidate_instructions),
        instructions_schema_missing: instructionsMissing,
      },
    }
  }

  return { config: null, error: primary.error.message }
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
  questionTypeMix?: QuestionTypeMix | Record<string, number> | null
  passingScore?: number | null
  passingCriteria?: string | null
  candidateInstructions?: string | null
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
  /** Bank size for random_from_bank publish validation */
  bankQuestionCount?: number | null
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

  const typeMix = normalizeQuestionTypeMix(
    input.questionTypeMix ?? existing?.question_type_mix ?? DEFAULT_QUESTION_TYPE_MIX
  )

  if (publish) {
    if (questionSelection === 'random_from_bank') {
      const bankCount = input.bankQuestionCount
      const need = Math.max(1, Number(input.questionCount ?? existing?.question_count ?? 1) || 1)
      if (bankCount == null || bankCount < 1) {
        return {
          error:
            'Add questions to the question bank before publishing with “Random from bank”. Type mix will auto-select from the bank.',
        }
      }
      if (bankCount < need) {
        return {
          error: `Question bank has ${bankCount} question(s) but this assessment needs ${need}. Add more questions or lower the count.`,
        }
      }
    } else {
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
  }

  const payload: Record<string, unknown> = {
    job_id: input.jobId,
    organization_id: input.organizationId,
    enabled: Boolean(input.enabled),
    duration_minutes: input.durationMinutes ?? null,
    question_count: input.questionCount ?? null,
    categories: Array.isArray(input.categories) ? input.categories : [],
    difficulty_distribution: input.difficultyDistribution ?? {},
    question_type_mix: typeMix,
    passing_score: input.passingScore ?? null,
    passing_criteria: input.passingCriteria?.trim() || null,
    candidate_instructions:
      input.candidateInstructions !== undefined
        ? sanitizeCandidateInstructions(input.candidateInstructions)
        : sanitizeCandidateInstructions(existing?.candidate_instructions),
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

  let { data, error } = await supabaseAdmin
    .from('recruitment_screening_configs')
    .upsert([payload], { onConflict: 'job_id' })
    .select(CONFIG_SELECT)
    .single()

  if (error) {
    const errMsg = error.message
    if (missingOptionalColumn(errMsg, 'candidate_instructions') && payload.candidate_instructions) {
      return { error: INSTRUCTIONS_SCHEMA_ERROR }
    }
    if (OPTIONAL_CONFIG_COLUMNS.some((col) => missingOptionalColumn(errMsg, col))) {
      const stripped = { ...payload }
      let retrySelect = CONFIG_SELECT
      for (const col of OPTIONAL_CONFIG_COLUMNS) {
        if (missingOptionalColumn(errMsg, col)) {
          delete stripped[col]
          retrySelect = retrySelect.replace(`, ${col}`, '')
        }
      }
      if (stripped.candidate_instructions == null && payload.candidate_instructions) {
        return { error: INSTRUCTIONS_SCHEMA_ERROR }
      }
      const retry = await supabaseAdmin
        .from('recruitment_screening_configs')
        .upsert([stripped], { onConflict: 'job_id' })
        .select(retrySelect)
        .single()
      data = retry.data
        ? ({
            ...(retry.data as unknown as Record<string, unknown>),
            question_type_mix: typeMix,
            candidate_instructions: payload.candidate_instructions ?? null,
          } as typeof data)
        : null
      error = retry.error
      if (!error && missingOptionalColumn(errMsg, 'candidate_instructions') && payload.candidate_instructions) {
        return { error: INSTRUCTIONS_SCHEMA_ERROR }
      }
    }
  }

  if (error || !data) return { error: error?.message || 'Could not save screening config' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: publish ? 'screening_published' : 'screening_config_updated',
    entityType: 'recruitment_screening_configs',
    entityId: data.id,
    metadata: { jobId: input.jobId, enabled: data.enabled, status: data.status },
  })

  return {
    config: {
      ...(data as Record<string, unknown>),
      question_type_mix: normalizeQuestionTypeMix(
        (data as { question_type_mix?: unknown }).question_type_mix ?? typeMix
      ),
      candidate_instructions: sanitizeCandidateInstructions(
        (data as { candidate_instructions?: unknown }).candidate_instructions ??
          payload.candidate_instructions
      ),
    },
  }
}

export async function listJobScreeningItems(jobId: string, organizationId: string) {
  if (!supabaseAdmin) return { items: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_job_screening_items')
    .select(
      'id, job_id, organization_id, question_id, sort_order, created_at, question:recruitment_questions(id, owner_type, organization_id, discipline, difficulty, prompt, expected_time_seconds, question_type, status)'
    )
    .eq('job_id', jobId)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
  if (error) return { items: [], error: error.message }
  const items = (data ?? []).filter((item) => {
    const question = Array.isArray(item.question) ? item.question[0] : item.question
    if (!question || typeof question !== 'object') return false
    return (question as { status?: string }).status !== 'archived'
  })
  return { items }
}

export async function assessmentHasStartableQuestions(input: {
  jobId: string
  organizationId: string
  config: Record<string, unknown> | null
}): Promise<{ ok: boolean; attachedCount: number; bankCount: number }> {
  const { items } = await listJobScreeningItems(input.jobId, input.organizationId)
  const attachedCount = items?.length ?? 0
  const selection = String(input.config?.question_selection ?? 'manual')
  if (selection !== 'random_from_bank') {
    return { ok: attachedCount > 0, attachedCount, bankCount: 0 }
  }
  const { listAvailableQuestions } = await import('@/lib/recruitment/questions')
  const { questions } = await listAvailableQuestions(input.organizationId)
  const bankCount = questions?.length ?? 0
  return { ok: bankCount > 0, attachedCount, bankCount }
}

export async function previewJobScreening(jobId: string, organizationId: string) {
  const { config, error } = await getJobScreeningConfig(jobId, organizationId)
  if (error) return { error }
  const selection = String(config?.question_selection ?? 'manual')
  const typeMix = normalizeQuestionTypeMix(config?.question_type_mix)
  const questionCount =
    config?.question_count != null ? Number(config.question_count) : null
  const categories = Array.isArray(config?.categories)
    ? (config.categories as unknown[]).map(String)
    : []

  if (selection === 'random_from_bank') {
    const { listAvailableQuestions } = await import('@/lib/recruitment/questions')
    const { normalizeBankQuestion, selectQuestionsForSession } = await import(
      '@/lib/recruitment/screening-materialize'
    )
    const { questions } = await listAvailableQuestions(organizationId)
    const pool = (questions ?? []).map((row) =>
      normalizeBankQuestion(row as Record<string, unknown>)
    )
    const selected = selectQuestionsForSession({
      pool,
      questionIds: [],
      questionCount,
      questionSelection: 'random_from_bank',
      randomized: config?.randomized !== false,
      seed: `preview:${jobId}:${Date.now()}`,
      categories,
      typeMix,
    })
    return {
      preview: {
        enabled: Boolean(config?.enabled),
        status: config?.status ?? 'draft',
        durationMinutes: config?.duration_minutes ?? null,
        questionCount,
        passingScore: config?.passing_score ?? null,
        sectionMinimums: config?.section_minimums ?? {},
        attemptPolicy: config?.attempt_policy ?? 'single',
        questionSelection: selection,
        randomized: config?.randomized !== false,
        dynamicParameters: Boolean(config?.dynamic_parameters),
        questionTypeMix: typeMix,
        sampleNote:
          'Sample auto-select from the live question bank. Each candidate gets a new draw matching the type mix — not the old attached list.',
        items: selected.map((q, idx) => ({
          sortOrder: idx,
          prompt: q.prompt,
          discipline: q.discipline,
          difficulty: q.difficulty,
          ownerType: q.owner_type,
          questionType: q.question_type,
          expectedTimeSeconds: q.expected_time_seconds,
        })),
      },
    }
  }

  const { items } = await listJobScreeningItems(jobId, organizationId)
  return {
    preview: {
      enabled: Boolean(config?.enabled),
      status: config?.status ?? 'draft',
      durationMinutes: config?.duration_minutes ?? null,
      questionCount,
      passingScore: config?.passing_score ?? null,
      sectionMinimums: config?.section_minimums ?? {},
      attemptPolicy: config?.attempt_policy ?? 'single',
      questionSelection: selection,
      randomized: config?.randomized !== false,
      dynamicParameters: Boolean(config?.dynamic_parameters),
      questionTypeMix: typeMix,
      sampleNote:
        selection === 'mixed'
          ? 'Attached questions plus auto-fill from the bank when a candidate starts.'
          : 'Manually attached questions for this role.',
      items: (items ?? []).map((item: Record<string, unknown>) => {
        const question = Array.isArray(item.question) ? item.question[0] : item.question
        const q = (question ?? {}) as Record<string, unknown>
        return {
          sortOrder: item.sort_order,
          prompt: q.prompt,
          discipline: q.discipline,
          difficulty: q.difficulty,
          ownerType: q.owner_type,
          questionType: q.question_type,
          expectedTimeSeconds: q.expected_time_seconds,
        }
      }),
    },
  }
}

export async function deleteJobScreeningConfig(input: {
  jobId: string
  organizationId: string
  actorUserId: string
}): Promise<{ success?: boolean; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { job } = await getOrganizationJob(input.jobId, input.organizationId)
  if (!job) return { error: 'Job not found' }

  await supabaseAdmin
    .from('recruitment_job_screening_items')
    .delete()
    .eq('job_id', input.jobId)
    .eq('organization_id', input.organizationId)

  const { error } = await supabaseAdmin
    .from('recruitment_screening_configs')
    .delete()
    .eq('job_id', input.jobId)
    .eq('organization_id', input.organizationId)

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'screening_deleted',
    entityType: 'recruitment_jobs',
    entityId: input.jobId,
  })

  return { success: true }
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
      .select('id, owner_type, organization_id, status')
      .in('id', uniqueIds)
    if (qError) return { error: qError.message }
    const allowed = (questions ?? []).filter(
      (q) =>
        (q as { status?: string }).status !== 'archived' &&
        (q.owner_type === 'platform' ||
          (q.owner_type === 'organization' && q.organization_id === input.organizationId))
    )
    if (allowed.length !== uniqueIds.length) {
      return {
        error: 'One or more questions are not available (deleted or not in this organization).',
      }
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
