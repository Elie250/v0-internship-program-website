/**
 * Screening session lifecycle — server-authoritative.
 */

import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { createEventId, enqueueWebhookEvent } from '@/lib/recruitment/api-webhooks'
import { getJobScreeningConfig, listJobScreeningItems } from '@/lib/recruitment/screening'
import {
  materializeSessionItems,
  normalizeBankQuestion,
  publicSessionItem,
  selectQuestionsForSession,
  type BankQuestion,
} from '@/lib/recruitment/screening-materialize'
import {
  computeOverallAndSections,
  evaluatePassCriteria,
  maxAttemptsFromPolicy,
  scoreAnswer,
  type ScoringStatus,
} from '@/lib/recruitment/screening-scoring'
import type { AnswerSpec } from '@/lib/recruitment/screening-parameters'
import {
  clampClientEventAt,
  computeExpiresAt,
  isSessionExpired,
  remainingMs,
  timeSpentMs,
} from '@/lib/recruitment/screening-timer'
import { recomputeSessionIntegrity } from '@/lib/recruitment/screening-integrity'

const SESSION_SELECT =
  'id, application_id, job_id, organization_id, candidate_user_id, screening_config_id, attempt_number, status, session_seed, config_snapshot, consent_acknowledged_at, started_at, expires_at, submitted_at, finalized_at, technical_score, max_score, section_scores, passed, completion_state, integrity_placeholder, integrity_band, integrity_summary, integrity_computed_at, created_at, updated_at'

const ITEM_SELECT =
  'id, session_id, organization_id, question_id, sort_order, question_type, section, category, difficulty, weight, expected_time_sec, resolved_prompt, options_snapshot, option_order, parameters_resolved, expected_answer, max_points, points_awarded, scoring_status, opened_at, answered_at, time_spent_ms, created_at'

type SessionRow = Record<string, unknown>

function asAnswerSpec(raw: unknown): AnswerSpec {
  if (raw && typeof raw === 'object' && 'answerSpec' in (raw as object)) {
    return ((raw as { answerSpec?: AnswerSpec }).answerSpec ?? {}) as AnswerSpec
  }
  return (raw && typeof raw === 'object' ? raw : {}) as AnswerSpec
}

async function loadApplicationForCandidate(applicationId: string, candidateUserId: string) {
  if (!supabaseAdmin) return { application: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select(
      'id, job_id, candidate_user_id, status, job:recruitment_jobs(id, organization_id, title, status)'
    )
    .eq('id', applicationId)
    .eq('candidate_user_id', candidateUserId)
    .maybeSingle()
  if (error) return { application: null, error: error.message }
  return { application: data, error: null }
}

async function countAttempts(applicationId: string) {
  if (!supabaseAdmin) return 0
  const { count } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .neq('status', 'cancelled')
  return count ?? 0
}

async function loadQuestionPool(organizationId: string, questionIds: string[]): Promise<BankQuestion[]> {
  if (!supabaseAdmin) return []
  const select =
    'id, owner_type, organization_id, discipline, difficulty, prompt, expected_time_seconds, answer_key, question_type, options, parameters, answer_spec, weight, section, status'
  const [{ data: platform }, { data: org }, { data: selected }] = await Promise.all([
    supabaseAdmin.from('recruitment_questions').select(select).eq('owner_type', 'platform').eq('status', 'active'),
    supabaseAdmin
      .from('recruitment_questions')
      .select(select)
      .eq('owner_type', 'organization')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    questionIds.length
      ? supabaseAdmin.from('recruitment_questions').select(select).in('id', questionIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const map = new Map<string, BankQuestion>()
  for (const row of [...(platform ?? []), ...(org ?? []), ...(selected ?? [])]) {
    if (!row) continue
    const q = normalizeBankQuestion(row as Record<string, unknown>)
    if ((row as { status?: string }).status === 'archived') continue
    if (
      q.owner_type === 'platform' ||
      (q.owner_type === 'organization' && q.organization_id === organizationId)
    ) {
      map.set(q.id, q)
    }
  }
  return Array.from(map.values())
}

export async function getCandidateScreeningEligibility(
  applicationId: string,
  candidateUserId: string
) {
  const { application, error } = await loadApplicationForCandidate(applicationId, candidateUserId)
  if (error || !application) return { error: error || 'Application not found' }

  const job = Array.isArray(application.job) ? application.job[0] : application.job
  if (!job?.organization_id) return { error: 'Job not found' }
  if (application.status === 'withdrawn' || application.status === 'rejected') {
    return {
      eligible: false,
      reason: 'This application is no longer eligible for screening.',
      application,
      job,
    }
  }

  const { config } = await getJobScreeningConfig(String(application.job_id), String(job.organization_id))
  if (!config || !config.enabled || config.status !== 'published') {
    return {
      eligible: false,
      reason: 'Technical screening is not available for this role yet.',
      application,
      job,
      config,
    }
  }

  const attempts = await countAttempts(applicationId)
  const maxAttempts = maxAttemptsFromPolicy(
    String(config.attempt_policy ?? 'single'),
    config.max_attempts != null ? Number(config.max_attempts) : null
  )

  const { data: active } = await supabaseAdmin!
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('application_id', applicationId)
    .eq('status', 'in_progress')
    .maybeSingle()

  const { data: latest } = await supabaseAdmin!
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('application_id', applicationId)
    .neq('status', 'cancelled')
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const canStart = !active && attempts < maxAttempts

  return {
    eligible: canStart || Boolean(active),
    canStart,
    reason: canStart
      ? null
      : active
        ? 'You have an active screening session.'
        : 'No attempts remaining for this application.',
    application,
    job,
    config,
    attemptsUsed: attempts,
    maxAttempts,
    activeSession: active,
    latestSession: latest,
  }
}

export async function startScreeningSession(input: {
  applicationId: string
  candidateUserId: string
  consentAcknowledged: boolean
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!input.consentAcknowledged) {
    return { error: 'Please acknowledge the screening instructions before starting.' }
  }

  const eligibility = await getCandidateScreeningEligibility(
    input.applicationId,
    input.candidateUserId
  )
  if (eligibility.error) return { error: eligibility.error }
  if (eligibility.activeSession) {
    return { session: eligibility.activeSession, resumed: true }
  }
  if (!eligibility.canStart || !eligibility.config || !eligibility.job) {
    return { error: eligibility.reason || 'Cannot start screening' }
  }

  const organizationId = String(eligibility.job.organization_id)
  const jobId = String(eligibility.application!.job_id)
  const config = eligibility.config
  const { items } = await listJobScreeningItems(jobId, organizationId)
  const questionIds = (items ?? []).map((item: { question_id: string }) => item.question_id)

  const pool = await loadQuestionPool(organizationId, questionIds)
  const seed = crypto.randomBytes(16).toString('hex')
  const selected = selectQuestionsForSession({
    pool,
    questionIds,
    questionCount: config.question_count != null ? Number(config.question_count) : null,
    questionSelection: String(config.question_selection ?? 'manual'),
    randomized: config.randomized !== false,
    seed,
    categories: Array.isArray(config.categories) ? config.categories.map(String) : [],
  })

  if (!selected.length) {
    return { error: 'No screening questions are configured for this role.' }
  }

  const materialized = materializeSessionItems({
    questions: selected,
    seed,
    useDynamicParameters: Boolean(config.dynamic_parameters),
  })

  const startedAt = new Date()
  const expiresAt = computeExpiresAt(
    startedAt,
    config.duration_minutes != null ? Number(config.duration_minutes) : null
  )
  const attemptNumber = (eligibility.attemptsUsed ?? 0) + 1

  const configSnapshot = {
    duration_minutes: config.duration_minutes,
    question_count: config.question_count,
    passing_score: config.passing_score,
    section_minimums: config.section_minimums ?? {},
    attempt_policy: config.attempt_policy,
    randomized: config.randomized,
    dynamic_parameters: config.dynamic_parameters,
    per_question_time_seconds: config.per_question_time_seconds,
  }

  const { data: session, error } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .insert([
      {
        application_id: input.applicationId,
        job_id: jobId,
        organization_id: organizationId,
        candidate_user_id: input.candidateUserId,
        screening_config_id: config.id,
        attempt_number: attemptNumber,
        status: 'in_progress',
        session_seed: seed,
        config_snapshot: configSnapshot,
        consent_acknowledged_at: startedAt.toISOString(),
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
    ])
    .select(SESSION_SELECT)
    .single()

  if (error || !session) {
    if (error?.code === '23505') {
      return { error: 'An active screening session already exists.' }
    }
    return { error: error?.message || 'Could not start screening' }
  }

  const { error: itemsError } = await supabaseAdmin.from('recruitment_session_items').insert(
    materialized.map((item) => ({
      session_id: session.id,
      organization_id: organizationId,
      question_id: item.question_id,
      sort_order: item.sort_order,
      question_type: item.question_type,
      section: item.section,
      category: item.category,
      difficulty: item.difficulty,
      weight: item.weight,
      expected_time_sec: item.expected_time_sec,
      resolved_prompt: item.resolved_prompt,
      options_snapshot: item.options_snapshot,
      option_order: item.option_order,
      parameters_resolved: item.parameters_resolved,
      expected_answer: item.expected_answer,
      max_points: item.max_points,
      scoring_status: 'pending',
    }))
  )

  if (itemsError) {
    await supabaseAdmin.from('recruitment_screening_sessions').delete().eq('id', session.id)
    return { error: itemsError.message }
  }

  if (eligibility.application!.status === 'submitted' || eligibility.application!.status === 'under_review') {
    await supabaseAdmin
      .from('recruitment_applications')
      .update({ status: 'screening', updated_at: startedAt.toISOString() })
      .eq('id', input.applicationId)
      .eq('candidate_user_id', input.candidateUserId)
  }

  await writeRecruitmentAudit({
    actorUserId: input.candidateUserId,
    organizationId,
    action: 'screening_started',
    entityType: 'recruitment_screening_sessions',
    entityId: session.id,
    metadata: { applicationId: input.applicationId, attemptNumber, questionCount: materialized.length },
  })

  return { session, resumed: false }
}

async function getOwnedSession(sessionId: string, candidateUserId: string) {
  if (!supabaseAdmin) return { session: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('id', sessionId)
    .eq('candidate_user_id', candidateUserId)
    .maybeSingle()
  if (error) return { session: null, error: error.message }
  if (!data) return { session: null, error: 'Session not found' }
  return { session: data as SessionRow, error: null }
}

export async function finalizeScreeningSession(
  sessionId: string,
  reason: 'submitted' | 'expired',
  actorUserId?: string | null
) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('id', sessionId)
    .maybeSingle()
  if (!session) return { error: 'Session not found' }
  if (session.status !== 'in_progress') return { session }

  const { data: items } = await supabaseAdmin
    .from('recruitment_session_items')
    .select(ITEM_SELECT)
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  const now = new Date().toISOString()
  const scoredItems = (items ?? []).map((item) => {
    let scoringStatus = item.scoring_status as ScoringStatus
    let pointsAwarded = item.points_awarded
    if (!item.answered_at) {
      scoringStatus = 'unanswered'
      pointsAwarded = 0
    }
    return {
      section: item.section as string | null,
      pointsAwarded: pointsAwarded != null ? Number(pointsAwarded) : 0,
      maxPoints: Number(item.max_points ?? 1),
      scoringStatus,
    }
  })

  // Mark unanswered
  for (const item of items ?? []) {
    if (!item.answered_at) {
      await supabaseAdmin
        .from('recruitment_session_items')
        .update({ scoring_status: 'unanswered', points_awarded: 0 })
        .eq('id', item.id)
        .is('answered_at', null)
    }
  }

  const totals = computeOverallAndSections(scoredItems)
  const snapshot = (session.config_snapshot ?? {}) as Record<string, unknown>
  const passingScore =
    snapshot.passing_score != null ? Number(snapshot.passing_score) : null
  const sectionMinimums =
    snapshot.section_minimums && typeof snapshot.section_minimums === 'object'
      ? (snapshot.section_minimums as Record<string, number>)
      : {}

  const passed = evaluatePassCriteria({
    percent: totals.percent,
    sectionScores: totals.sectionScores,
    passingScore,
    sectionMinimums,
  })

  let completionState: string = reason === 'expired' ? 'expired' : 'complete'
  if (totals.hasPendingManual) completionState = 'pending_manual'
  else if (totals.answeredCount < (items?.length ?? 0) && reason === 'submitted') {
    completionState = 'partial'
  }

  const { data: updated, error } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .update({
      status: reason === 'expired' ? 'expired' : 'submitted',
      submitted_at: reason === 'submitted' ? now : session.submitted_at,
      finalized_at: now,
      technical_score: totals.percent,
      max_score: 100,
      section_scores: totals.sectionScores,
      passed,
      completion_state: completionState,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('status', 'in_progress')
    .select(SESSION_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: actorUserId ?? session.candidate_user_id,
    organizationId: session.organization_id,
    action: reason === 'expired' ? 'screening_expired' : 'screening_submitted',
    entityType: 'recruitment_screening_sessions',
    entityId: sessionId,
    metadata: {
      technicalScore: totals.percent,
      passed,
      completionState,
    },
  })

  void enqueueWebhookEvent({
    organizationId: String(session.organization_id),
    eventType: 'screening.completed',
    eventId: createEventId('screening.completed', sessionId),
    data: {
      session_id: sessionId,
      application_id: session.application_id,
      job_id: session.job_id,
      technical_score: totals.percent,
      passed,
      status: reason === 'expired' ? 'expired' : 'submitted',
    },
  })

  await writeRecruitmentAudit({
    actorUserId: actorUserId ?? session.candidate_user_id,
    organizationId: session.organization_id,
    action: 'screening_result_finalized',
    entityType: 'recruitment_screening_sessions',
    entityId: sessionId,
    metadata: { technicalScore: totals.percent, passed },
  })

  await recomputeSessionIntegrity(sessionId)

  return { session: updated ?? session, totals }
}

async function ensureSessionNotExpired(session: SessionRow) {
  if (session.status !== 'in_progress') return { session, expired: session.status === 'expired' }
  if (!isSessionExpired(String(session.expires_at))) return { session, expired: false }
  const result = await finalizeScreeningSession(String(session.id), 'expired', String(session.candidate_user_id))
  return { session: result.session ?? session, expired: true }
}

export async function getCandidateSessionView(sessionId: string, candidateUserId: string) {
  const { session, error } = await getOwnedSession(sessionId, candidateUserId)
  if (error || !session) return { error: error || 'Session not found' }

  const ensured = await ensureSessionNotExpired(session)
  const current = ensured.session as SessionRow

  const { data: items } = await supabaseAdmin!
    .from('recruitment_session_items')
    .select(ITEM_SELECT)
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  const publicItems = (items ?? []).map((item) =>
    publicSessionItem({
      id: item.id,
      sort_order: item.sort_order,
      question_type: item.question_type,
      section: item.section,
      category: item.category,
      difficulty: item.difficulty,
      weight: Number(item.weight ?? 1),
      expected_time_sec: item.expected_time_sec,
      resolved_prompt: item.resolved_prompt,
      options_snapshot: (item.options_snapshot ?? []) as { id: string; label: string }[],
      parameters_resolved: (item.parameters_resolved ?? {}) as Record<string, number>,
      opened_at: item.opened_at,
      answered_at: item.answered_at,
      scoring_status: item.scoring_status,
    })
  )

  const nextUnanswered = publicItems.find((item) => !item.answered)

  return {
    session: {
      id: current.id,
      status: current.status,
      attemptNumber: current.attempt_number,
      startedAt: current.started_at,
      expiresAt: current.expires_at,
      remainingMs: remainingMs(String(current.expires_at)),
      submittedAt: current.submitted_at,
      technicalScore: current.status === 'in_progress' ? null : current.technical_score,
      sectionScores: current.status === 'in_progress' ? null : current.section_scores,
      passed: current.status === 'in_progress' ? null : current.passed,
      completionState: current.completion_state,
      questionCount: publicItems.length,
      answeredCount: publicItems.filter((i) => i.answered).length,
    },
    items: publicItems,
    currentItemId: nextUnanswered?.id ?? null,
  }
}

export async function openSessionItem(input: {
  sessionId: string
  itemId: string
  candidateUserId: string
}) {
  const { session, error } = await getOwnedSession(input.sessionId, input.candidateUserId)
  if (error || !session) return { error: error || 'Session not found' }
  const ensured = await ensureSessionNotExpired(session)
  if (ensured.expired || (ensured.session as SessionRow).status !== 'in_progress') {
    return { error: 'This screening session has ended.' }
  }

  const now = new Date().toISOString()
  const { data: item, error: itemError } = await supabaseAdmin!
    .from('recruitment_session_items')
    .update({ opened_at: now })
    .eq('id', input.itemId)
    .eq('session_id', input.sessionId)
    .is('opened_at', null)
    .select(ITEM_SELECT)
    .maybeSingle()

  if (itemError) return { error: itemError.message }

  const { data: current } = await supabaseAdmin!
    .from('recruitment_session_items')
    .select(ITEM_SELECT)
    .eq('id', input.itemId)
    .eq('session_id', input.sessionId)
    .maybeSingle()

  if (!current) return { error: 'Question not found' }

  return {
    item: publicSessionItem({
      id: current.id,
      sort_order: current.sort_order,
      question_type: current.question_type,
      section: current.section,
      category: current.category,
      difficulty: current.difficulty,
      weight: Number(current.weight ?? 1),
      expected_time_sec: current.expected_time_sec,
      resolved_prompt: current.resolved_prompt,
      options_snapshot: (current.options_snapshot ?? []) as { id: string; label: string }[],
      parameters_resolved: (current.parameters_resolved ?? {}) as Record<string, number>,
      opened_at: current.opened_at ?? item?.opened_at ?? now,
      answered_at: current.answered_at,
    }),
  }
}

export async function submitSessionAnswer(input: {
  sessionId: string
  itemId: string
  candidateUserId: string
  answerPayload: Record<string, unknown>
  clientEventAt?: string | null
}) {
  const { session, error } = await getOwnedSession(input.sessionId, input.candidateUserId)
  if (error || !session) return { error: error || 'Session not found' }
  const ensured = await ensureSessionNotExpired(session)
  if (ensured.expired || (ensured.session as SessionRow).status !== 'in_progress') {
    return { error: 'This screening session has ended. New answers are not accepted.' }
  }

  const { data: item } = await supabaseAdmin!
    .from('recruitment_session_items')
    .select(ITEM_SELECT)
    .eq('id', input.itemId)
    .eq('session_id', input.sessionId)
    .maybeSingle()

  if (!item) return { error: 'Question not found' }

  const now = new Date()
  const openedAt = item.opened_at ?? now.toISOString()
  const expected = item.expected_answer as Record<string, unknown>
  const answerSpec = asAnswerSpec(expected) as AnswerSpec
  const numericExpected =
    expected?.numeric && typeof expected.numeric === 'object'
      ? (expected.numeric as { value: number; tolerance: number })
      : null

  const scored = scoreAnswer({
    questionType: item.question_type as 'multiple_choice' | 'multiple_select' | 'numeric' | 'short_text',
    answerPayload: input.answerPayload,
    answerSpec,
    params: (item.parameters_resolved ?? {}) as Record<string, number>,
    maxPoints: Number(item.max_points ?? 1),
    expectedSnapshot: numericExpected,
  })

  const { error: answerError } = await supabaseAdmin!.from('recruitment_screening_answers').upsert(
    [
      {
        session_id: input.sessionId,
        session_item_id: input.itemId,
        organization_id: session.organization_id,
        candidate_user_id: input.candidateUserId,
        answer_payload: input.answerPayload,
        client_event_at: clampClientEventAt(input.clientEventAt, now),
        updated_at: now.toISOString(),
      },
    ],
    { onConflict: 'session_item_id' }
  )
  if (answerError) return { error: answerError.message }

  const { error: itemError } = await supabaseAdmin!
    .from('recruitment_session_items')
    .update({
      opened_at: openedAt,
      answered_at: now.toISOString(),
      time_spent_ms: timeSpentMs(openedAt, now),
      points_awarded: scored.pointsAwarded,
      scoring_status: scored.scoringStatus,
    })
    .eq('id', input.itemId)
    .eq('session_id', input.sessionId)

  if (itemError) return { error: itemError.message }

  await writeRecruitmentAudit({
    actorUserId: input.candidateUserId,
    organizationId: String(session.organization_id),
    action: 'screening_answer_submitted',
    entityType: 'recruitment_session_items',
    entityId: input.itemId,
    metadata: { sessionId: input.sessionId, scoringStatus: scored.scoringStatus },
  })

  return { success: true, scoringStatus: scored.scoringStatus }
}

export async function submitScreeningSession(sessionId: string, candidateUserId: string) {
  const { session, error } = await getOwnedSession(sessionId, candidateUserId)
  if (error || !session) return { error: error || 'Session not found' }
  const ensured = await ensureSessionNotExpired(session)
  if ((ensured.session as SessionRow).status !== 'in_progress') {
    return { session: ensured.session as SessionRow }
  }
  return finalizeScreeningSession(sessionId, 'submitted', candidateUserId)
}

export async function recordScreeningEvent(input: {
  sessionId: string
  candidateUserId: string
  eventType: string
  payload?: Record<string, unknown>
  clientEventAt?: string | null
  sessionItemId?: string | null
  metadata?: Record<string, unknown>
}) {
  const { ingestScreeningIntegrityEvent } = await import('@/lib/recruitment/screening-integrity')
  return ingestScreeningIntegrityEvent({
    sessionId: input.sessionId,
    candidateUserId: input.candidateUserId,
    body: {
      eventType: input.eventType,
      payload: input.payload ?? {},
      clientEventAt: input.clientEventAt,
      sessionItemId: input.sessionItemId,
      metadata: input.metadata,
    },
  })
}

export async function getEmployerApplicationScreening(
  organizationId: string,
  applicationId: string
) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data: application } = await supabaseAdmin
    .from('recruitment_applications')
    .select('id, job_id, candidate_user_id, status, job:recruitment_jobs(id, organization_id, title)')
    .eq('id', applicationId)
    .maybeSingle()
  if (!application) return { error: 'Application not found' }
  const job = Array.isArray(application.job) ? application.job[0] : application.job
  if (!job || String(job.organization_id) !== organizationId) {
    return { error: 'Forbidden' }
  }

  const { data: sessions } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('application_id', applicationId)
    .eq('organization_id', organizationId)
    .order('attempt_number', { ascending: false })

  return {
    applicationId,
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      attemptNumber: s.attempt_number,
      status: s.status,
      startedAt: s.started_at,
      expiresAt: s.expires_at,
      submittedAt: s.submitted_at,
      finalizedAt: s.finalized_at,
      technicalScore: s.technical_score,
      sectionScores: s.section_scores,
      passed: s.passed,
      completionState: s.completion_state,
      integrityBand: s.integrity_band,
      integritySummary: s.integrity_summary,
      integrityPlaceholder: s.integrity_placeholder,
    })),
  }
}

export async function getEmployerSessionReview(organizationId: string, sessionId: string) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(SESSION_SELECT)
    .eq('id', sessionId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (!session) return { error: 'Session not found' }

  const { data: items } = await supabaseAdmin
    .from('recruitment_session_items')
    .select(
      'id, sort_order, question_type, section, category, difficulty, weight, expected_time_sec, resolved_prompt, options_snapshot, max_points, points_awarded, scoring_status, opened_at, answered_at, time_spent_ms, question_id'
    )
    .eq('session_id', sessionId)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })

  const { data: answers } = await supabaseAdmin
    .from('recruitment_screening_answers')
    .select('session_item_id, answer_payload, created_at')
    .eq('session_id', sessionId)
    .eq('organization_id', organizationId)

  const answerMap = new Map(
    (answers ?? []).map((a) => [a.session_item_id, a.answer_payload as Record<string, unknown>])
  )

  return {
    session: {
      id: session.id,
      attemptNumber: session.attempt_number,
      status: session.status,
      startedAt: session.started_at,
      expiresAt: session.expires_at,
      submittedAt: session.submitted_at,
      technicalScore: session.technical_score,
      sectionScores: session.section_scores,
      passed: session.passed,
      completionState: session.completion_state,
      integrityBand: session.integrity_band,
      integritySummary: session.integrity_summary,
    },
    items: (items ?? []).map((item) => ({
      id: item.id,
      sortOrder: item.sort_order,
      questionType: item.question_type,
      section: item.section,
      prompt: item.resolved_prompt,
      options: item.options_snapshot,
      maxPoints: item.max_points,
      pointsAwarded: item.points_awarded,
      scoringStatus: item.scoring_status,
      openedAt: item.opened_at,
      answeredAt: item.answered_at,
      timeSpentMs: item.time_spent_ms,
      expectedTimeSec: item.expected_time_sec,
      answer: answerMap.get(item.id) ?? null,
      // Never expose expected_answer / expressions / platform keys here
    })),
  }
}
