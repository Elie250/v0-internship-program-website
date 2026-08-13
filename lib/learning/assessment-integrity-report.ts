/**
 * Academy assessment integrity — ingest, recompute, lecturer report.
 * Uses shared lib/integrity. Never auto-voids or changes scores.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  aggregateIntegrityAssessment,
  buildIntegrityTimeline,
  type IntegrityEventRecord,
} from '@/lib/integrity/aggregate'
import {
  ACADEMY_INTEGRITY_THRESHOLDS,
  integritySuggestedActions,
  isIntegrityBand,
  isIntegrityReviewOutcome,
  type IntegrityBand,
  type IntegrityReviewOutcome,
} from '@/lib/integrity/types'
import {
  checkEventRateLimit,
  rejectClientControlledIntegrityFields,
  validateIntegrityEventInput,
} from '@/lib/integrity/validate'

const EVENT_SELECT =
  'id, attempt_id, event_type, metadata, sanitized_metadata, server_context, server_received_at, created_at'

function flagsFromAssessment(band: IntegrityBand, categories: {
  visibilityLeaves: number
  clipboardAttempts: number
}): string[] {
  const flags: string[] = []
  if (categories.visibilityLeaves >= 5 || band === 'REVIEW' || band === 'HIGH_CONCERN') {
    if (categories.visibilityLeaves >= 2) flags.push('excessive_tab_switch')
  }
  if (categories.clipboardAttempts >= 1) flags.push('paste_blocked')
  if (band === 'HIGH_CONCERN') flags.push('high_concern')
  else if (band === 'REVIEW') flags.push('review_recommended')
  return flags
}

export async function recomputeAttemptIntegrity(attemptId: string) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, score, tab_switch_count, integrity_flags, assessment_id')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return { error: 'Attempt not found' }

  let thresholdOverrides: Record<string, unknown> | null = null
  if (attempt.assessment_id) {
    const { data: assessment } = await supabaseAdmin
      .from('course_assessments')
      .select('integrity_thresholds')
      .eq('id', attempt.assessment_id)
      .maybeSingle()
    thresholdOverrides =
      (assessment?.integrity_thresholds as Record<string, unknown> | null) ?? null
  }

  const { data: events, error: eventsError } = await supabaseAdmin
    .from('assessment_attempt_events')
    .select(EVENT_SELECT)
    .eq('attempt_id', attemptId)
    .order('server_received_at', { ascending: true })

  if (eventsError) {
    const fallback = await supabaseAdmin
      .from('assessment_attempt_events')
      .select('id, attempt_id, event_type, metadata, created_at')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true })
    if (fallback.error) return { error: fallback.error.message }
    return persistAssessment(
      attemptId,
      attempt.score,
      (fallback.data ?? []) as IntegrityEventRecord[],
      thresholdOverrides
    )
  }

  return persistAssessment(
    attemptId,
    attempt.score,
    (events ?? []) as IntegrityEventRecord[],
    thresholdOverrides
  )
}

async function persistAssessment(
  attemptId: string,
  priorScore: number | null,
  events: IntegrityEventRecord[],
  thresholdOverrides?: Record<string, unknown> | null
) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const assessment = aggregateIntegrityAssessment(events, thresholdOverrides, {
    product: 'academy',
    baseThresholds: ACADEMY_INTEGRITY_THRESHOLDS,
    dedupeLeaves: true,
  })

  const summary = {
    band: assessment.band,
    summaryText: assessment.summaryText,
    recommendation: assessment.recommendation,
    reasons: assessment.reasons,
    categories: assessment.categories,
    categoryBands: assessment.categoryBands,
    eventCount: assessment.eventCount,
    suggestedActions: integritySuggestedActions(assessment.band, 'academy'),
    usesTechnicalScore: false,
    isCheatingVerdict: false,
    doesNotAutoVoid: true,
    scoreUnchanged: priorScore,
  }

  const flags = flagsFromAssessment(assessment.band, assessment.categories)
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('assessment_attempts')
    .update({
      integrity_band: assessment.band,
      integrity_summary: summary,
      integrity_computed_at: now,
      tab_switch_count: assessment.categories.visibilityLeaves,
      integrity_flags: flags,
      updated_at: now,
      // Never touch score
    })
    .eq('id', attemptId)

  if (error) {
    // Columns may be missing before migration 80 — still update legacy fields
    await supabaseAdmin
      .from('assessment_attempts')
      .update({
        tab_switch_count: assessment.categories.visibilityLeaves,
        integrity_flags: flags,
        updated_at: now,
      })
      .eq('id', attemptId)
  }

  // Verify score untouched
  const { data: after } = await supabaseAdmin
    .from('assessment_attempts')
    .select('score')
    .eq('id', attemptId)
    .maybeSingle()
  if (after && priorScore != null && after.score !== priorScore) {
    await supabaseAdmin
      .from('assessment_attempts')
      .update({ score: priorScore })
      .eq('id', attemptId)
  }

  return { assessment, summary }
}

export async function ingestAssessmentIntegrityEvent(input: {
  attemptId: string
  userId: string
  eventType: string
  metadata?: Record<string, unknown>
  clientEventAt?: string | null
  clientMeta?: { userAgent?: string | null; ip?: string | null }
}): Promise<{
  ok: boolean
  tabSwitchCount?: number
  integrityBand?: string | null
  error?: string
  flood?: boolean
}> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  rejectClientControlledIntegrityFields((input.metadata ?? {}) as Record<string, unknown>)

  const validated = validateIntegrityEventInput({
    eventType: input.eventType,
    metadata: input.metadata,
    clientEventAt: input.clientEventAt,
  })
  if (!validated.ok) return { ok: false, error: validated.error }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, status, score, user_id, client_meta_hash')
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!attempt || attempt.status !== 'in_progress') {
    return { ok: false, error: 'Attempt not active' }
  }

  // Advisory device-fingerprint change (log once, then adopt new hash — never blocks)
  if (input.clientMeta && attempt.client_meta_hash) {
    const { createHash } = await import('crypto')
    const nextHash = createHash('sha256')
      .update(`${input.clientMeta.userAgent ?? ''}|${input.clientMeta.ip ?? ''}`)
      .digest('hex')
      .slice(0, 24)
    if (nextHash && nextHash !== attempt.client_meta_hash) {
      const fpRow = {
        attempt_id: input.attemptId,
        event_type: 'navigation' as const,
        metadata: { reason: 'device_fingerprint_changed' },
        sanitized_metadata: { reason: 'device_fingerprint_changed' },
        server_context: { source: 'server', timelineAuthority: 'server_received_at' },
        server_received_at: new Date().toISOString(),
      }
      const { error: fpError } = await supabaseAdmin.from('assessment_attempt_events').insert([fpRow])
      if (fpError) {
        await supabaseAdmin.from('assessment_attempt_events').insert([
          {
            attempt_id: input.attemptId,
            event_type: 'navigation',
            metadata: { reason: 'device_fingerprint_changed' },
          },
        ])
      }
      // Adopt new hash so we only record the change once (even if event insert soft-failed)
      await supabaseAdmin
        .from('assessment_attempts')
        .update({ client_meta_hash: nextHash })
        .eq('id', input.attemptId)
        .eq('status', 'in_progress')
    }
  }

  const { data: recent } = await supabaseAdmin
    .from('assessment_attempt_events')
    .select('server_received_at, created_at')
    .eq('attempt_id', input.attemptId)
    .order('created_at', { ascending: false })
    .limit(80)

  const rate = checkEventRateLimit(
    (recent ?? []).map((row) => ({
      serverReceivedAt: String(row.server_received_at ?? row.created_at),
    }))
  )

  const now = new Date().toISOString()

  if (!rate.allowed) {
    await supabaseAdmin.from('assessment_attempt_events').insert([
      {
        attempt_id: input.attemptId,
        event_type: 'request_flood',
        metadata: { reason: rate.reason },
        sanitized_metadata: { reason: rate.reason ?? 'rate_limit' },
        server_context: { source: 'server', timelineAuthority: 'server_received_at' },
        server_received_at: now,
      },
    ])
    await recomputeAttemptIntegrity(input.attemptId)
    return { ok: false, flood: true, error: 'Too many integrity events' }
  }

  const insertRow: Record<string, unknown> = {
    attempt_id: input.attemptId,
    event_type: validated.event.eventType,
    metadata: {
      ...validated.event.sanitizedMetadata,
      originalClientType: input.eventType,
    },
    sanitized_metadata: validated.event.sanitizedMetadata,
    server_context: {
      source: 'student_client',
      timelineAuthority: 'server_received_at',
    },
    server_received_at: now,
  }

  const { error: insertError } = await supabaseAdmin
    .from('assessment_attempt_events')
    .insert([insertRow])

  if (insertError) {
    // Pre-migration 80: insert legacy shape only
    const legacy = await supabaseAdmin.from('assessment_attempt_events').insert([
      {
        attempt_id: input.attemptId,
        event_type: validated.event.eventType,
        metadata: {
          ...validated.event.sanitizedMetadata,
          originalClientType: input.eventType,
        },
      },
    ])
    if (legacy.error) return { ok: false, error: legacy.error.message }
  }

  const recomputed = await recomputeAttemptIntegrity(input.attemptId)
  if ('error' in recomputed && recomputed.error && !('assessment' in recomputed)) {
    return { ok: true, error: recomputed.error }
  }

  return {
    ok: true,
    tabSwitchCount:
      'assessment' in recomputed ? recomputed.assessment?.categories.visibilityLeaves : undefined,
    integrityBand: 'assessment' in recomputed ? recomputed.assessment?.band ?? null : null,
  }
}

export async function getLecturerIntegrityReport(input: {
  attemptId: string
  courseId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select(
      'id, assessment_id, user_id, status, score, passed, attempt_number, started_at, submitted_at, expires_at, tab_switch_count, integrity_flags, integrity_band, integrity_summary, integrity_computed_at'
    )
    .eq('id', input.attemptId)
    .maybeSingle()

  if (!attempt) return { error: 'Attempt not found' }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('id, title, course_id')
    .eq('id', attempt.assessment_id)
    .maybeSingle()

  if (!assessment || String(assessment.course_id) !== input.courseId) {
    return { error: 'Attempt not found for this course' }
  }

  const [{ data: events, error: eventsError }, { data: reviews }, { data: student }] =
    await Promise.all([
      supabaseAdmin
        .from('assessment_attempt_events')
        .select(EVENT_SELECT)
        .eq('attempt_id', input.attemptId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('assessment_integrity_reviews')
        .select('id, outcome, notes, reviewer_user_id, created_at')
        .eq('attempt_id', input.attemptId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', attempt.user_id)
        .maybeSingle(),
    ])

  let eventRows = (events ?? []) as IntegrityEventRecord[]
  if (eventsError) {
    const fallback = await supabaseAdmin
      .from('assessment_attempt_events')
      .select('id, attempt_id, event_type, metadata, created_at')
      .eq('attempt_id', input.attemptId)
      .order('created_at', { ascending: true })
    eventRows = (fallback.data ?? []) as IntegrityEventRecord[]
  }

  const live = aggregateIntegrityAssessment(eventRows, null, {
    product: 'academy',
    baseThresholds: ACADEMY_INTEGRITY_THRESHOLDS,
    dedupeLeaves: true,
  })

  const band = (attempt.integrity_band as IntegrityBand | null) ?? live.band
  const resolvedBand: IntegrityBand = isIntegrityBand(String(band)) ? (band as IntegrityBand) : live.band
  const summary =
    attempt.integrity_summary && typeof attempt.integrity_summary === 'object'
      ? (attempt.integrity_summary as Record<string, unknown>)
      : null

  return {
    score: attempt.score,
    passed: attempt.passed,
    integrity: {
      band: resolvedBand,
      summaryText: String(summary?.summaryText ?? live.summaryText),
      recommendation: String(summary?.recommendation ?? live.recommendation),
      reasons: (summary?.reasons as unknown[]) ?? live.reasons,
      categories: (summary?.categories as Record<string, number>) ?? live.categories,
      categoryBands: live.categoryBands,
      eventCount: eventRows.length,
      computedAt: attempt.integrity_computed_at,
      suggestedActions:
        (summary?.suggestedActions as string[]) ??
        integritySuggestedActions(resolvedBand, 'academy'),
      decisionGuidance:
        'This is an advisory integrity report for lecturers and admins. It is not proof of cheating and does not void the attempt or change the score. Record a review decision below, then void or re-open attempts manually if needed.',
      isCheatingVerdict: false,
      doesNotAutoVoid: true,
    },
    timeline: buildIntegrityTimeline(eventRows),
    reviews: reviews ?? [],
    attempt: {
      id: attempt.id,
      assessmentId: attempt.assessment_id,
      assessmentTitle: assessment.title,
      status: attempt.status,
      attemptNumber: attempt.attempt_number,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      tabSwitchCount: attempt.tab_switch_count,
      integrityFlags: attempt.integrity_flags,
    },
    student: student
      ? {
          id: student.id,
          name: [student.first_name, student.last_name].filter(Boolean).join(' ') || student.email,
          email: student.email,
        }
      : null,
  }
}

export async function recordAssessmentIntegrityReview(input: {
  attemptId: string
  courseId: string
  reviewerUserId: string
  outcome: string
  notes?: string | null
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isIntegrityReviewOutcome(input.outcome)) {
    return { error: 'Invalid review outcome' }
  }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, assessment_id, score, status, integrity_band')
    .eq('id', input.attemptId)
    .maybeSingle()
  if (!attempt) return { error: 'Attempt not found' }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('id, course_id')
    .eq('id', attempt.assessment_id)
    .maybeSingle()
  if (!assessment || String(assessment.course_id) !== input.courseId) {
    return { error: 'Attempt not found for this course' }
  }

  const priorScore = attempt.score

  const { data: review, error } = await supabaseAdmin
    .from('assessment_integrity_reviews')
    .insert([
      {
        attempt_id: input.attemptId,
        assessment_id: attempt.assessment_id,
        course_id: input.courseId,
        reviewer_user_id: input.reviewerUserId,
        outcome: input.outcome as IntegrityReviewOutcome,
        notes: input.notes?.trim().slice(0, 4000) || null,
      },
    ])
    .select('id, outcome, notes, reviewer_user_id, created_at')
    .single()

  if (error) return { error: error.message }

  const { data: after } = await supabaseAdmin
    .from('assessment_attempts')
    .select('score, status')
    .eq('id', input.attemptId)
    .maybeSingle()

  if (after && after.score !== priorScore) {
    await supabaseAdmin
      .from('assessment_attempts')
      .update({ score: priorScore })
      .eq('id', input.attemptId)
  }

  return {
    review,
    scoreUnchanged: true,
    statusUnchanged: after?.status === attempt.status,
  }
}

/**
 * After a manual void, rebuild assessment_submissions from remaining
 * non-voided submitted attempts. Does not rewrite the voided attempt's score field.
 */
async function recomputeSubmissionAfterVoid(input: {
  assessmentId: string
  enrollmentId: string | null
  userId: string | null
}) {
  if (!supabaseAdmin || !input.enrollmentId) return

  const { data: remaining } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, score, passed, answers, correct_count, total_questions, submitted_at')
    .eq('assessment_id', input.assessmentId)
    .eq('enrollment_id', input.enrollmentId)
    .eq('status', 'submitted')
    .not('score', 'is', null)
    .order('score', { ascending: false, nullsFirst: false })

  const now = new Date().toISOString()
  const best = remaining?.[0] ?? null

  // Load lock policy — voiding a passing attempt must not leave the student locked forever
  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('lock_after_pass')
    .eq('id', input.assessmentId)
    .maybeSingle()
  const lockAfterPass = assessment?.lock_after_pass !== false
  const shouldRemainLocked = Boolean(best?.passed) && lockAfterPass

  if (!best) {
    await supabaseAdmin
      .from('assessment_submissions')
      .update({
        score: null,
        passed: false,
        best_attempt_id: null,
        best_score: null,
        answers: null,
        correct_count: null,
        locked_at: null,
        updated_at: now,
      })
      .eq('assessment_id', input.assessmentId)
      .eq('enrollment_id', input.enrollmentId)
    return
  }

  await supabaseAdmin
    .from('assessment_submissions')
    .update({
      score: best.score,
      passed: Boolean(best.passed),
      best_attempt_id: best.id,
      best_score: best.score,
      answers: best.answers ?? undefined,
      correct_count: best.correct_count ?? undefined,
      total_questions: best.total_questions ?? undefined,
      submitted_at: best.submitted_at ?? now,
      locked_at: shouldRemainLocked ? now : null,
      updated_at: now,
    })
    .eq('assessment_id', input.assessmentId)
    .eq('enrollment_id', input.enrollmentId)
}

/** Explicit manual void — never called from integrity band computation. */
export async function voidAssessmentAttempt(input: {
  attemptId: string
  courseId: string
  actorUserId: string
  reason?: string | null
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, assessment_id, enrollment_id, user_id, status, score')
    .eq('id', input.attemptId)
    .maybeSingle()
  if (!attempt) return { error: 'Attempt not found' }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('id, course_id')
    .eq('id', attempt.assessment_id)
    .maybeSingle()
  if (!assessment || String(assessment.course_id) !== input.courseId) {
    return { error: 'Attempt not found for this course' }
  }

  if (attempt.status === 'voided') return { attempt }

  const priorScore = attempt.score
  const now = new Date().toISOString()
  const { data: updated, error } = await supabaseAdmin
    .from('assessment_attempts')
    .update({ status: 'voided', updated_at: now })
    .eq('id', input.attemptId)
    .select('id, status, score')
    .single()

  if (error) return { error: error.message }

  // Invariant: void never rewrites the recorded score on the attempt row
  if (updated && updated.score !== priorScore) {
    await supabaseAdmin
      .from('assessment_attempts')
      .update({ score: priorScore })
      .eq('id', input.attemptId)
  }

  await recomputeSubmissionAfterVoid({
    assessmentId: String(attempt.assessment_id),
    enrollmentId: attempt.enrollment_id != null ? String(attempt.enrollment_id) : null,
    userId: attempt.user_id != null ? String(attempt.user_id) : null,
  })

  await supabaseAdmin.from('assessment_integrity_reviews').insert([
    {
      attempt_id: input.attemptId,
      assessment_id: attempt.assessment_id,
      course_id: input.courseId,
      reviewer_user_id: input.actorUserId,
      outcome: 'recommend_void',
      notes: `Manual void. ${input.reason?.trim() || ''}`.trim().slice(0, 4000),
    },
  ])

  return { attempt: updated, scoreUnchanged: true }
}
