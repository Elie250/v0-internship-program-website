import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const MISSING_TABLE = /relation .* does not exist|could not find the table/i
export const MISSING_COLUMN = /column .* does not exist|could not find the .* column/i

export const SESSION_SELECT_BASE =
  'id, topic, scheduled_at, duration_minutes, meeting_link, location, recording_url, notes, created_at'

export const SESSION_SELECT_FULL = `${SESSION_SELECT_BASE}, session_materials, pre_session_checklist`

export type SessionRow = {
  id: string
  topic: string
  scheduled_at: string
  duration_minutes: number | null
  meeting_link: string | null
  location: string | null
  recording_url: string | null
  notes: string | null
  created_at?: string
  session_materials?: string | null
  pre_session_checklist?: string | null
}

function normalizeSession(row: Record<string, unknown>): SessionRow {
  return {
    id: String(row.id),
    topic: String(row.topic),
    scheduled_at: String(row.scheduled_at),
    duration_minutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
    meeting_link: (row.meeting_link as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    recording_url: (row.recording_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    session_materials: (row.session_materials as string | null) ?? null,
    pre_session_checklist: (row.pre_session_checklist as string | null) ?? null,
  }
}

export async function queryCourseSessions(
  courseId: string,
  limit = 100
): Promise<{ sessions: SessionRow[]; error?: string; kitColumnsReady: boolean }> {
  if (!supabaseAdmin) return { sessions: [], error: 'Database not configured', kitColumnsReady: false }

  const baseQuery = () =>
    supabaseAdmin!
      .from('course_sessions')
      .select(SESSION_SELECT_BASE)
      .eq('course_id', courseId)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

  const fullQuery = () =>
    supabaseAdmin!
      .from('course_sessions')
      .select(SESSION_SELECT_FULL)
      .eq('course_id', courseId)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

  const full = await fullQuery()
  if (!full.error) {
    return {
      sessions: (full.data ?? []).map((row) => normalizeSession(row as Record<string, unknown>)),
      kitColumnsReady: true,
    }
  }

  if (MISSING_TABLE.test(full.error.message)) {
    return { sessions: [], kitColumnsReady: false }
  }

  if (MISSING_COLUMN.test(full.error.message)) {
    const base = await baseQuery()
    if (base.error) return { sessions: [], error: base.error.message, kitColumnsReady: false }
    return {
      sessions: (base.data ?? []).map((row) => normalizeSession(row as Record<string, unknown>)),
      kitColumnsReady: false,
    }
  }

  return { sessions: [], error: full.error.message, kitColumnsReady: false }
}

export async function insertCourseSession(input: {
  courseId: string
  createdBy: string
  topic: string
  scheduled_at: string
  duration_minutes: number | null
  meeting_link: string | null
  location: string | null
  recording_url: string | null
  notes: string | null
  session_materials: string | null
  pre_session_checklist: string | null
}): Promise<{ session: SessionRow | null; error?: string; kitColumnsReady: boolean }> {
  if (!supabaseAdmin) return { session: null, error: 'Database not configured', kitColumnsReady: false }

  const basePayload = {
    course_id: input.courseId,
    created_by: input.createdBy,
    topic: input.topic,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    meeting_link: input.meeting_link,
    location: input.location,
    recording_url: input.recording_url,
    notes: input.notes,
  }

  const fullPayload = {
    ...basePayload,
    session_materials: input.session_materials,
    pre_session_checklist: input.pre_session_checklist,
  }

  const full = await supabaseAdmin
    .from('course_sessions')
    .insert(fullPayload)
    .select(SESSION_SELECT_FULL)
    .single()

  if (!full.error && full.data) {
    return {
      session: normalizeSession(full.data as Record<string, unknown>),
      kitColumnsReady: true,
    }
  }

  if (full.error && MISSING_TABLE.test(full.error.message)) {
    return { session: null, error: full.error.message, kitColumnsReady: false }
  }

  if (full.error && MISSING_COLUMN.test(full.error.message)) {
    const noteParts = [input.notes]
    if (input.session_materials) noteParts.push(`Materials:\n${input.session_materials}`)
    if (input.pre_session_checklist) noteParts.push(`Checklist:\n${input.pre_session_checklist}`)
    const mergedNotes = noteParts.filter(Boolean).join('\n\n') || null

    const base = await supabaseAdmin
      .from('course_sessions')
      .insert({ ...basePayload, notes: mergedNotes })
      .select(SESSION_SELECT_BASE)
      .single()

    if (base.error) return { session: null, error: base.error.message, kitColumnsReady: false }
    return {
      session: normalizeSession(base.data as Record<string, unknown>),
      kitColumnsReady: false,
    }
  }

  return { session: null, error: full.error?.message ?? 'Failed to create session', kitColumnsReady: false }
}
