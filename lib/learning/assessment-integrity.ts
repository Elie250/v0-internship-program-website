import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { courseLessonsComplete } from '@/lib/learning/lesson-integrity'

export const INTEGRITY_HINT =
  'Assessment integrity tables missing. Run scripts/35-assessment-integrity.sql in Supabase.'

export type AssessmentPolicy = {
  maxAttempts: number
  timeLimitMinutes: number | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  requireLessonsComplete: boolean
  lockAfterPass: boolean
  cooldownMinutes: number
  revealAnswers: 'never' | 'after_pass' | 'after_all_attempts'
}

export type AttemptQuestion = {
  id: string
  question: string
  options: string[]
}

export type GradedAnswer = {
  questionId: string
  question: string
  options: string[]
  chosenIndex: number
  correctIndex: number
  correct: boolean
  explanation: string | null
}

function isMissingIntegrityTable(message: string | undefined): boolean {
  const msg = message ?? ''
  return (
    (msg.includes('assessment_attempts') ||
      msg.includes('max_attempts') ||
      msg.includes('reveal_answers') ||
      msg.includes('best_attempt_id')) &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  )
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function parseQuestionOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((id: unknown) => String(id))
}

function policyFromRow(row: Record<string, unknown>): AssessmentPolicy {
  const reveal = String(row.reveal_answers ?? 'after_all_attempts')
  return {
    maxAttempts: Math.max(1, Number(row.max_attempts ?? 3)),
    timeLimitMinutes: row.time_limit_minutes != null ? Number(row.time_limit_minutes) : null,
    shuffleQuestions: row.shuffle_questions !== false,
    shuffleOptions: row.shuffle_options !== false,
    requireLessonsComplete: row.require_lessons_complete !== false,
    lockAfterPass: row.lock_after_pass !== false,
    cooldownMinutes: Math.max(0, Number(row.cooldown_minutes ?? 60)),
    revealAnswers:
      reveal === 'never' || reveal === 'after_pass' ? reveal : 'after_all_attempts',
  }
}

function mapDisplayToOriginal(
  optionOrder: number[],
  displayIndex: number
): number {
  if (!Number.isInteger(displayIndex) || displayIndex < 0 || displayIndex >= optionOrder.length) {
    return -1
  }
  return optionOrder[displayIndex] ?? -1
}

function buildDisplayQuestion(
  question: {
    id: string
    question: string
    options: string[]
    correct_index: number
    explanation: string | null
  },
  optionOrder: number[]
): AttemptQuestion {
  const options = Array.isArray(question.options) ? question.options.map(String) : []
  const orderedOptions = optionOrder.map((idx) => options[idx] ?? '')
  return {
    id: question.id,
    question: question.question,
    options: orderedOptions,
  }
}

async function loadAssessmentContext(assessmentId: string, userId: string) {
  if (!supabaseAdmin) return { ok: false as const, error: 'Database not configured' }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('*')
    .eq('id', assessmentId)
    .maybeSingle()

  if (!assessment || assessment.is_published === false) {
    return { ok: false as const, error: 'Assessment not found' }
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('course_id', assessment.course_id)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) {
    return { ok: false as const, error: 'You are not admitted to this programme' }
  }

  const { data: questions } = await supabaseAdmin
    .from('assessment_questions')
    .select('id, question, options, correct_index, explanation, sort_order')
    .eq('assessment_id', assessmentId)
    .order('sort_order', { ascending: true })

  if (!questions?.length) {
    return { ok: false as const, error: 'This assessment has no questions yet' }
  }

  return {
    ok: true as const,
    assessment,
    enrollment,
    questions,
    policy: policyFromRow(assessment as Record<string, unknown>),
  }
}

export async function getAssessmentAccessSummary(
  assessmentId: string,
  userId: string
): Promise<
  | {
      ok: true
      policy: AssessmentPolicy
      attemptsUsed: number
      attemptsRemaining: number
      passed: boolean
      locked: boolean
      canStart: boolean
      blockReason: string | null
      inProgressAttemptId: string | null
      expiresAt: string | null
    }
  | { ok: false; error: string }
> {
  const ctx = await loadAssessmentContext(assessmentId, userId)
  if (!ctx.ok) return ctx

  const { policy, enrollment, assessment, questions } = ctx

  const { data: submission } = await supabaseAdmin!
    .from('assessment_submissions')
    .select('passed, locked_at, attempt_count, submitted_at')
    .eq('assessment_id', assessmentId)
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  const { data: attempts, error: attemptsError } = await supabaseAdmin!
    .from('assessment_attempts')
    .select('id, status, started_at, expires_at, attempt_number, submitted_at')
    .eq('assessment_id', assessmentId)
    .eq('enrollment_id', enrollment.id)
    .order('started_at', { ascending: false })

  if (attemptsError && isMissingIntegrityTable(attemptsError.message)) {
    return { ok: false, error: INTEGRITY_HINT }
  }

  const submittedAttempts = (attempts ?? []).filter((a) => a.status === 'submitted')
  const attemptsUsed = submittedAttempts.length
  const passed = Boolean(submission?.passed)
  const locked = Boolean(submission?.locked_at) || (policy.lockAfterPass && passed)

  let blockReason: string | null = null

  if (policy.requireLessonsComplete) {
    const lessons = await courseLessonsComplete(userId, String(assessment.course_id))
    if (!lessons.complete && lessons.total > 0) {
      blockReason = `Complete all lessons first (${lessons.completed}/${lessons.total} done).`
    }
  }

  if (!blockReason && locked) {
    blockReason = 'This assessment is locked after your passing score was recorded.'
  }

  if (!blockReason && attemptsUsed >= policy.maxAttempts) {
    blockReason = `You have used all ${policy.maxAttempts} attempts for this assessment.`
  }

  if (!blockReason && policy.cooldownMinutes > 0 && submittedAttempts.length > 0) {
    const last = submittedAttempts[0]
    const lastAt = new Date(String(last.submitted_at ?? last.started_at)).getTime()
    const cooldownMs = policy.cooldownMinutes * 60 * 1000
    const remaining = lastAt + cooldownMs - Date.now()
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60000)
      blockReason = `Wait ${mins} minute${mins === 1 ? '' : 's'} before your next attempt.`
    }
  }

  const inProgress = (attempts ?? []).find((a) => a.status === 'in_progress') ?? null

  if (inProgress?.expires_at && new Date(String(inProgress.expires_at)).getTime() < Date.now()) {
    await supabaseAdmin!
      .from('assessment_attempts')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', inProgress.id)
  }

  const activeInProgress =
    inProgress &&
    (!inProgress.expires_at || new Date(String(inProgress.expires_at)).getTime() >= Date.now())
      ? inProgress
      : null

  return {
    ok: true,
    policy,
    attemptsUsed,
    attemptsRemaining: Math.max(0, policy.maxAttempts - attemptsUsed),
    passed,
    locked,
    canStart: !blockReason && (!!activeInProgress || attemptsUsed < policy.maxAttempts),
    blockReason,
    inProgressAttemptId: activeInProgress ? String(activeInProgress.id) : null,
    expiresAt: activeInProgress?.expires_at ? String(activeInProgress.expires_at) : null,
  }
}

export async function startAssessmentAttempt(
  assessmentId: string,
  userId: string
): Promise<
  | {
      ok: true
      attemptId: string
      attemptNumber: number
      expiresAt: string | null
      timeLimitMinutes: number | null
      questions: AttemptQuestion[]
    }
  | { ok: false; error: string }
> {
  const access = await getAssessmentAccessSummary(assessmentId, userId)
  if (!access.ok) return access

  if (access.inProgressAttemptId) {
    return resumeAssessmentAttempt(access.inProgressAttemptId, userId)
  }

  if (!access.canStart) {
    return { ok: false, error: access.blockReason ?? 'You cannot start this assessment now.' }
  }

  const ctx = await loadAssessmentContext(assessmentId, userId)
  if (!ctx.ok) return ctx

  const { policy, enrollment, questions } = ctx
  const attemptNumber = access.attemptsUsed + 1
  const orderedQuestions = policy.shuffleQuestions
    ? shuffle(questions)
    : [...questions]

  const questionOrder = orderedQuestions.map((q) => String(q.id))
  const optionOrders: Record<string, number[]> = {}

  for (const question of orderedQuestions) {
    const optionCount = Array.isArray(question.options) ? question.options.length : 0
    const base = Array.from({ length: optionCount }, (_, i) => i)
    optionOrders[String(question.id)] = policy.shuffleOptions ? shuffle(base) : base
  }

  const startedAt = new Date()
  const expiresAt =
    policy.timeLimitMinutes && policy.timeLimitMinutes > 0
      ? new Date(startedAt.getTime() + policy.timeLimitMinutes * 60 * 1000).toISOString()
      : null

  const { data: attempt, error } = await supabaseAdmin!.from('assessment_attempts').insert([
    {
      assessment_id: assessmentId,
      enrollment_id: enrollment.id,
      user_id: userId,
      attempt_number: attemptNumber,
      status: 'in_progress',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt,
      question_order: questionOrder,
      option_orders: optionOrders,
    },
  ]).select('id').single()

  if (error) {
    return { ok: false, error: isMissingIntegrityTable(error.message) ? INTEGRITY_HINT : error.message }
  }

  const displayQuestions = orderedQuestions.map((q) =>
    buildDisplayQuestion(
      {
        id: String(q.id),
        question: String(q.question),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_index: Number(q.correct_index),
        explanation: (q.explanation as string | null) ?? null,
      },
      optionOrders[String(q.id)] ?? []
    )
  )

  return {
    ok: true,
    attemptId: String(attempt.id),
    attemptNumber,
    expiresAt,
    timeLimitMinutes: policy.timeLimitMinutes,
    questions: displayQuestions,
  }
}

export async function resumeAssessmentAttempt(
  attemptId: string,
  userId: string
): Promise<
  | {
      ok: true
      attemptId: string
      attemptNumber: number
      expiresAt: string | null
      timeLimitMinutes: number | null
      questions: AttemptQuestion[]
    }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!attempt || attempt.status !== 'in_progress') {
    return { ok: false, error: 'No active attempt found' }
  }

  if (attempt.expires_at && new Date(String(attempt.expires_at)).getTime() < Date.now()) {
    await supabaseAdmin
      .from('assessment_attempts')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', attemptId)
    return { ok: false, error: 'Your attempt timed out. Start a new attempt if attempts remain.' }
  }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('time_limit_minutes')
    .eq('id', attempt.assessment_id)
    .maybeSingle()

  const questionOrder = parseQuestionOrder(attempt.question_order)
  const optionOrders = (attempt.option_orders ?? {}) as Record<string, number[]>

  const { data: questions } = await supabaseAdmin
    .from('assessment_questions')
    .select('id, question, options, correct_index, explanation')
    .in('id', questionOrder)

  const byId = new Map((questions ?? []).map((q) => [String(q.id), q]))
  const displayQuestions = questionOrder
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((q) =>
      buildDisplayQuestion(
        {
          id: String(q!.id),
          question: String(q!.question),
          options: Array.isArray(q!.options) ? q!.options.map(String) : [],
          correct_index: Number(q!.correct_index),
          explanation: (q!.explanation as string | null) ?? null,
        },
        optionOrders[String(q!.id)] ?? []
      )
    )

  return {
    ok: true,
    attemptId,
    attemptNumber: Number(attempt.attempt_number ?? 1),
    expiresAt: attempt.expires_at ? String(attempt.expires_at) : null,
    timeLimitMinutes:
      assessment?.time_limit_minutes != null ? Number(assessment.time_limit_minutes) : null,
    questions: displayQuestions,
  }
}

export async function logAttemptIntegrityEvent(input: {
  attemptId: string
  userId: string
  eventType: string
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; tabSwitchCount?: number }> {
  if (!supabaseAdmin) return { ok: false }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, status, tab_switch_count, integrity_flags')
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!attempt || attempt.status !== 'in_progress') return { ok: false }

  await supabaseAdmin.from('assessment_attempt_events').insert([
    {
      attempt_id: input.attemptId,
      event_type: input.eventType,
      metadata: input.metadata ?? {},
    },
  ])

  let tabSwitchCount = Number(attempt.tab_switch_count ?? 0)
  const flags = Array.isArray(attempt.integrity_flags) ? [...attempt.integrity_flags] : []

  if (input.eventType === 'tab_hidden' || input.eventType === 'window_blur') {
    tabSwitchCount += 1
    if (tabSwitchCount >= 5 && !flags.includes('excessive_tab_switch')) {
      flags.push('excessive_tab_switch')
    }
  }

  if (input.eventType === 'paste_blocked') {
    if (!flags.includes('paste_blocked')) flags.push('paste_blocked')
  }

  await supabaseAdmin
    .from('assessment_attempts')
    .update({
      tab_switch_count: tabSwitchCount,
      integrity_flags: flags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.attemptId)

  return { ok: true, tabSwitchCount }
}

export async function submitAssessmentAttempt(input: {
  attemptId: string
  userId: string
  answers: Record<string, number>
}): Promise<
  | {
      ok: true
      score: number
      passed: boolean
      correctCount: number
      totalQuestions: number
      attemptCount: number
      revealAnswers: boolean
      results: GradedAnswer[]
      integrityFlags: string[]
    }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*')
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!attempt || attempt.status !== 'in_progress') {
    return { ok: false, error: 'This attempt is not active' }
  }

  if (attempt.expires_at && new Date(String(attempt.expires_at)).getTime() < Date.now()) {
    await supabaseAdmin
      .from('assessment_attempts')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', input.attemptId)
    return { ok: false, error: 'Time is up for this attempt.' }
  }

  const ctx = await loadAssessmentContext(String(attempt.assessment_id), input.userId)
  if (!ctx.ok) return ctx

  const { policy, enrollment, questions } = ctx
  const questionOrder = parseQuestionOrder(attempt.question_order)
  const optionOrders = (attempt.option_orders ?? {}) as Record<string, number[]>
  const byId = new Map(questions.map((q) => [String(q.id), q]))

  const results: GradedAnswer[] = questionOrder
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((q) => {
      const questionId = String(q!.id)
      const displayIndex = Number(input.answers[questionId])
      const optionOrder = optionOrders[questionId] ?? []
      const chosenOriginal = mapDisplayToOriginal(optionOrder, displayIndex)
      const correctIndex = Number(q!.correct_index)
      const options = Array.isArray(q!.options) ? q!.options.map(String) : []
      const displayOptions = optionOrder.map((idx) => options[idx] ?? '')

      return {
        questionId,
        question: String(q!.question),
        options: displayOptions,
        chosenIndex: displayIndex,
        correctIndex: optionOrder.indexOf(correctIndex),
        correct: chosenOriginal === correctIndex,
        explanation: (q!.explanation as string | null) ?? null,
      }
    })

  const correctCount = results.filter((r) => r.correct).length
  const totalQuestions = results.length
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0
  const passingScore = Number(ctx.assessment.passing_score ?? 70)
  const passed = score >= passingScore
  const now = new Date().toISOString()

  const integrityFlags = Array.isArray(attempt.integrity_flags)
    ? attempt.integrity_flags.map(String)
    : []

  await supabaseAdmin
    .from('assessment_attempts')
    .update({
      status: 'submitted',
      submitted_at: now,
      updated_at: now,
      answers: input.answers,
      score,
      passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
    })
    .eq('id', input.attemptId)

  const { data: existingSubmission } = await supabaseAdmin
    .from('assessment_submissions')
    .select('id, score, passed, attempt_count, locked_at, best_attempt_id')
    .eq('assessment_id', attempt.assessment_id)
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  const previousAttempts = Number(existingSubmission?.attempt_count ?? 0)
  const attemptCount = previousAttempts + 1
  const previousBest = existingSubmission?.score != null ? Number(existingSubmission.score) : -1
  const isBest = score >= previousBest
  const shouldLock = passed && policy.lockAfterPass
  const finalScore = isBest ? score : previousBest >= 0 ? previousBest : score
  const finalPassed = isBest ? passed : Boolean(existingSubmission?.passed) || passed

  const { data: allSubmitted } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id')
    .eq('assessment_id', attempt.assessment_id)
    .eq('enrollment_id', enrollment.id)
    .eq('status', 'submitted')

  const attemptsUsed = allSubmitted?.length ?? attemptCount
  const revealAnswers =
    policy.revealAnswers === 'never'
      ? false
      : policy.revealAnswers === 'after_pass'
        ? passed
        : attemptsUsed >= policy.maxAttempts || (passed && policy.lockAfterPass)

  let bestAttemptId = input.attemptId
  if (!isBest && existingSubmission?.best_attempt_id) {
    bestAttemptId = String(existingSubmission.best_attempt_id)
  }

  await supabaseAdmin.from('assessment_submissions').upsert(
    [
      {
        assessment_id: attempt.assessment_id,
        enrollment_id: enrollment.id,
        user_id: input.userId,
        score: finalScore,
        passed: finalPassed,
        answers: isBest ? input.answers : undefined,
        correct_count: isBest ? correctCount : undefined,
        total_questions: totalQuestions,
        attempt_count: attemptCount,
        submitted_at: now,
        updated_at: now,
        best_attempt_id: bestAttemptId,
        best_score: finalScore,
        locked_at: shouldLock || existingSubmission?.locked_at ? now : null,
      },
    ],
    { onConflict: 'assessment_id,enrollment_id' }
  )

  return {
    ok: true,
    score,
    passed,
    correctCount,
    totalQuestions,
    attemptCount,
    revealAnswers,
    results: revealAnswers
      ? results
      : results.map((r) => ({
          ...r,
          correctIndex: -1,
          explanation: null,
        })),
    integrityFlags,
  }
}

export function hashClientMeta(userAgent: string | null, ip: string | null): string {
  return createHash('sha256')
    .update(`${userAgent ?? ''}|${ip ?? ''}`)
    .digest('hex')
    .slice(0, 24)
}
