/**
 * External API response serializers — never expose answer keys, AI keys, or unscoped HR notes.
 */

export function serializeExternalJob(job: Record<string, unknown>) {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description ?? null,
    responsibilities: job.responsibilities ?? null,
    requirements: job.requirements ?? null,
    qualifications: job.qualifications ?? null,
    location: job.location ?? null,
    employment_type: job.employment_type ?? null,
    work_mode: job.work_mode ?? null,
    category: job.category ?? null,
    department: job.department ?? null,
    skills: job.skills ?? [],
    status: job.status,
    visibility: job.visibility ?? null,
    published_at: job.published_at ?? null,
    application_deadline: job.application_deadline ?? null,
    created_at: job.created_at,
    updated_at: job.updated_at,
  }
}

export function serializeExternalApplication(
  app: Record<string, unknown>,
  options?: { includeNotes?: boolean; notes?: unknown[] }
) {
  const snapshot = (app.profile_snapshot ?? {}) as Record<string, unknown>
  const job = Array.isArray(app.job) ? app.job[0] : app.job
  return {
    id: app.id,
    job_id: app.job_id,
    status: app.status,
    submitted_at: app.submitted_at,
    updated_at: app.updated_at,
    candidate: {
      // Profile snapshot fields only — no passwords/tokens
      full_name: snapshot.full_name ?? null,
      email: snapshot.email ?? null,
      phone: snapshot.phone ?? null,
      headline: snapshot.headline ?? null,
      location: snapshot.location ?? null,
      summary: snapshot.summary ?? null,
      skills: snapshot.skills ?? null,
      education: snapshot.education ?? null,
      experience: snapshot.experience ?? null,
    },
    job: job
      ? { id: (job as { id?: string }).id, title: (job as { title?: string }).title }
      : null,
    has_cv: Boolean(app.cv_document_id),
    ...(options?.includeNotes ? { notes: options.notes ?? [] } : {}),
  }
}

export function serializeExternalScreeningSession(session: Record<string, unknown>) {
  return {
    id: session.id,
    application_id: session.application_id ?? null,
    job_id: session.job_id ?? null,
    attempt_number: session.attemptNumber ?? session.attempt_number ?? null,
    status: session.status,
    technical_score: session.technicalScore ?? session.technical_score ?? null,
    section_scores: session.sectionScores ?? session.section_scores ?? null,
    passed: session.passed ?? null,
    integrity_band: session.integrityBand ?? session.integrity_band ?? null,
    // Never include answer keys, expected answers, or raw integrity event streams for mutation
    started_at: session.startedAt ?? session.started_at ?? null,
    submitted_at: session.submittedAt ?? session.submitted_at ?? null,
  }
}

export function serializeExternalInterview(interview: Record<string, unknown>) {
  return {
    id: interview.id,
    job_id: interview.job_id,
    application_id: interview.application_id,
    interview_type: interview.interview_type,
    status: interview.status,
    scheduled_at: interview.scheduled_at,
    duration_minutes: interview.duration_minutes,
    timezone: interview.timezone ?? null,
    location: interview.location ?? null,
    meeting_url: interview.meeting_url ?? null,
    candidate_instructions: interview.candidate_instructions ?? null,
    // internal_notes omitted unless notes:read is handled by caller
    created_at: interview.created_at,
    updated_at: interview.updated_at,
  }
}

/** Strip answer-key fields from any accidental payload */
export function stripAnswerKeys<T extends Record<string, unknown>>(payload: T): T {
  const blocked = new Set([
    'expected_answer',
    'answer_key',
    'expression',
    'correct_options',
    'scoring_expression',
    'OPENAI_API_KEY',
    'apiKey',
    'signing_secret',
    'secret_hash',
  ])
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (blocked.has(k)) continue
    out[k] = v
  }
  return out as T
}
