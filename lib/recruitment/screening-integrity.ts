/**
 * Screening integrity persistence — event ingest, aggregation, HR review.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  aggregateIntegrityAssessment,
  buildIntegrityTimeline,
  type IntegrityEventRecord,
} from '@/lib/recruitment/screening-integrity-aggregate'
import {
  integritySuggestedActions,
  isIntegrityBand,
  isIntegrityReviewOutcome,
  type IntegrityBand,
  type IntegrityReviewOutcome,
} from '@/lib/recruitment/screening-integrity-types'
import {
  checkEventRateLimit,
  rejectClientControlledIntegrityFields,
  validateIntegrityEventInput,
} from '@/lib/recruitment/screening-integrity-validate'

const EVENT_SELECT =
  'id, session_id, organization_id, candidate_user_id, session_item_id, event_type, payload, sanitized_metadata, server_context, client_event_at, server_received_at'

async function getOwnedSession(sessionId: string, candidateUserId: string) {
  if (!supabaseAdmin) return { session: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(
      'id, organization_id, candidate_user_id, job_id, status, started_at, expires_at, technical_score, integrity_band, integrity_summary'
    )
    .eq('id', sessionId)
    .eq('candidate_user_id', candidateUserId)
    .maybeSingle()
  if (error) return { session: null, error: error.message }
  if (!data) return { session: null, error: 'Session not found' }
  return { session: data, error: null }
}

async function loadThresholdsForSession(session: {
  job_id: string
  organization_id: string
}): Promise<Record<string, unknown> | null> {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('recruitment_screening_configs')
    .select('integrity_thresholds')
    .eq('job_id', session.job_id)
    .eq('organization_id', session.organization_id)
    .maybeSingle()
  return (data?.integrity_thresholds as Record<string, unknown> | null) ?? null
}

export async function recomputeSessionIntegrity(sessionId: string, organizationId?: string) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('id, organization_id, job_id, candidate_user_id, technical_score')
    .eq('id', sessionId)
    .maybeSingle()
  if (!session) return { error: 'Session not found' }
  if (organizationId && session.organization_id !== organizationId) {
    return { error: 'Forbidden' }
  }

  const { data: events } = await supabaseAdmin
    .from('recruitment_screening_events')
    .select(EVENT_SELECT)
    .eq('session_id', sessionId)
    .eq('organization_id', session.organization_id)
    .order('server_received_at', { ascending: true })

  const thresholds = await loadThresholdsForSession(session)
  const assessment = aggregateIntegrityAssessment(
    (events ?? []) as IntegrityEventRecord[],
    thresholds,
    { product: 'talent', dedupeLeaves: true }
  )

  const summary = {
    band: assessment.band,
    summaryText: assessment.summaryText,
    recommendation: assessment.recommendation,
    reasons: assessment.reasons,
    categories: assessment.categories,
    categoryBands: assessment.categoryBands,
    eventCount: assessment.eventCount,
    suggestedActions: integritySuggestedActions(assessment.band),
    usesTechnicalScore: false,
    isCheatingVerdict: false,
    doesNotAutoReject: true,
    technicalScoreUnchanged: session.technical_score,
  }

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .update({
      integrity_band: assessment.band,
      integrity_summary: summary,
      integrity_computed_at: now,
      integrity_placeholder: summary,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('organization_id', session.organization_id)

  if (error) return { error: error.message }

  // Never touch technical_score here
  return { assessment, summary }
}

export async function ingestScreeningIntegrityEvent(input: {
  sessionId: string
  candidateUserId: string
  body: Record<string, unknown>
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  rejectClientControlledIntegrityFields(input.body)

  const { session, error } = await getOwnedSession(input.sessionId, input.candidateUserId)
  if (error || !session) return { error: error || 'Session not found' }

  const validated = validateIntegrityEventInput({
    eventType: String(input.body.eventType ?? input.body.type ?? ''),
    payload: input.body.payload,
    metadata: input.body.metadata,
    clientEventAt:
      input.body.clientEventAt != null
        ? String(input.body.clientEventAt)
        : input.body.client_event_at != null
          ? String(input.body.client_event_at)
          : null,
    sessionItemId: input.body.sessionItemId ?? input.body.session_item_id,
  })
  if (!validated.ok) return { error: validated.error }

  if (validated.event.sessionItemId) {
    const { data: item } = await supabaseAdmin
      .from('recruitment_session_items')
      .select('id')
      .eq('id', validated.event.sessionItemId)
      .eq('session_id', input.sessionId)
      .eq('organization_id', session.organization_id)
      .maybeSingle()
    if (!item) return { error: 'Invalid session item reference' }
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
  const { data: recent } = await supabaseAdmin
    .from('recruitment_screening_events')
    .select('server_received_at')
    .eq('session_id', input.sessionId)
    .gte('server_received_at', oneMinuteAgo)
    .order('server_received_at', { ascending: false })
    .limit(80)

  const rate = checkEventRateLimit(
    (recent ?? []).map((r) => ({ serverReceivedAt: String(r.server_received_at) }))
  )

  if (!rate.allowed) {
    // Record a server-derived flood signal (at most once per burst) then reject
    await supabaseAdmin.from('recruitment_screening_events').insert([
      {
        session_id: input.sessionId,
        organization_id: session.organization_id,
        candidate_user_id: input.candidateUserId,
        event_type: 'request_flood',
        payload: {},
        sanitized_metadata: {},
        server_context: {
          reason: rate.reason,
          source: 'server',
          sessionStatus: session.status,
        },
        client_event_at: null,
      },
    ])
    await recomputeSessionIntegrity(input.sessionId)
    return { error: 'Too many events. Please continue the assessment normally.', flooded: true }
  }

  const serverNow = new Date()
  const serverContext = {
    sessionStatus: session.status,
    source: 'candidate_client',
    // Explicit: client timestamps are not authoritative for timeline
    timelineAuthority: 'server_received_at',
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('recruitment_screening_events')
    .insert([
      {
        session_id: input.sessionId,
        organization_id: session.organization_id,
        candidate_user_id: input.candidateUserId,
        session_item_id: validated.event.sessionItemId,
        event_type: validated.event.eventType,
        payload: validated.event.payload,
        sanitized_metadata: validated.event.sanitizedMetadata,
        server_context: serverContext,
        client_event_at: validated.event.clientEventAt,
        server_received_at: serverNow.toISOString(),
      },
    ])
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // Lightweight recompute during active sessions (every event is fine at our rate limits)
  await recomputeSessionIntegrity(input.sessionId)

  return { success: true, eventId: inserted?.id }
}

export async function getEmployerIntegrityReport(
  organizationId: string,
  sessionId: string
) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select(
      'id, organization_id, application_id, job_id, candidate_user_id, status, technical_score, section_scores, passed, integrity_band, integrity_summary, integrity_computed_at, started_at, submitted_at, finalized_at'
    )
    .eq('id', sessionId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!session) return { error: 'Session not found' }

  const [{ data: events }, { data: reviews }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('recruitment_screening_events')
      .select(EVENT_SELECT)
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId)
      .order('server_received_at', { ascending: true }),
    supabaseAdmin
      .from('recruitment_integrity_reviews')
      .select('id, outcome, notes, reviewer_user_id, created_at')
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('recruitment_session_items')
      .select('id, sort_order, resolved_prompt')
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId),
  ])

  const itemMap = new Map(
    (items ?? []).map((item) => [
      item.id,
      { id: item.id, sortOrder: item.sort_order, prompt: item.resolved_prompt },
    ])
  )

  const thresholds = await loadThresholdsForSession(session)
  const live = aggregateIntegrityAssessment((events ?? []) as IntegrityEventRecord[], thresholds, {
    product: 'talent',
    dedupeLeaves: true,
  })
  const band = (session.integrity_band as IntegrityBand | null) ?? live.band
  const summary =
    session.integrity_summary && typeof session.integrity_summary === 'object'
      ? (session.integrity_summary as Record<string, unknown>)
      : {
          band: live.band,
          summaryText: live.summaryText,
          recommendation: live.recommendation,
          reasons: live.reasons,
          categories: live.categories,
        }

  const timeline = buildIntegrityTimeline((events ?? []) as IntegrityEventRecord[]).map((row) => ({
    ...row,
    item: row.sessionItemId ? itemMap.get(row.sessionItemId) ?? null : null,
  }))

  const affectedItemIds = Array.from(
    new Set(
      (events ?? [])
        .map((e) => e.session_item_id)
        .filter(Boolean)
        .map(String)
    )
  )

  const resolvedBand: IntegrityBand = isIntegrityBand(String(band)) ? (band as IntegrityBand) : live.band

  return {
    technicalScore: session.technical_score,
    sectionScores: session.section_scores,
    passed: session.passed,
    integrity: {
      band: resolvedBand,
      summaryText: String(summary.summaryText ?? live.summaryText),
      recommendation: String(summary.recommendation ?? live.recommendation),
      reasons: (summary.reasons as unknown[]) ?? live.reasons,
      categories: (summary.categories as Record<string, number>) ?? live.categories,
      categoryBands: live.categoryBands,
      eventCount: events?.length ?? 0,
      computedAt: session.integrity_computed_at,
      suggestedActions: integritySuggestedActions(resolvedBand),
      decisionGuidance:
        'This is an advisory integrity report for hiring managers. It is not proof of cheating and does not reject the candidate. Record a review decision below, then update pipeline status yourself if needed.',
      // Never claim cheating
      isCheatingVerdict: false,
      doesNotAutoReject: true,
    },
    timeline,
    affectedQuestions: affectedItemIds.map((id) => itemMap.get(id)).filter(Boolean),
    reviews: reviews ?? [],
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      submittedAt: session.submitted_at,
      finalizedAt: session.finalized_at,
    },
  }
}

export async function recordIntegrityReview(input: {
  organizationId: string
  sessionId: string
  reviewerUserId: string
  outcome: string
  notes?: string | null
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isIntegrityReviewOutcome(input.outcome)) {
    return { error: 'Invalid review outcome' }
  }

  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('id, organization_id, technical_score, integrity_band')
    .eq('id', input.sessionId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()
  if (!session) return { error: 'Session not found' }

  // Integrity APIs must not accept or modify technical_score
  const { data: review, error } = await supabaseAdmin
    .from('recruitment_integrity_reviews')
    .insert([
      {
        session_id: input.sessionId,
        organization_id: input.organizationId,
        reviewer_user_id: input.reviewerUserId,
        outcome: input.outcome as IntegrityReviewOutcome,
        notes: input.notes?.trim().slice(0, 4000) || null,
      },
    ])
    .select('id, outcome, notes, reviewer_user_id, created_at')
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.reviewerUserId,
    organizationId: input.organizationId,
    action: 'integrity_review_recorded',
    entityType: 'recruitment_integrity_reviews',
    entityId: review.id,
    metadata: {
      sessionId: input.sessionId,
      outcome: input.outcome,
      priorBand: session.integrity_band,
      technicalScoreUnchanged: session.technical_score,
    },
  })

  // Verify technical score untouched
  const { data: after } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('technical_score')
    .eq('id', input.sessionId)
    .maybeSingle()

  if (after && after.technical_score !== session.technical_score) {
    // Should be impossible — restore if somehow changed
    await supabaseAdmin
      .from('recruitment_screening_sessions')
      .update({ technical_score: session.technical_score })
      .eq('id', input.sessionId)
  }

  return { review }
}
