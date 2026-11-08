import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { loadCourseReportPreviewDocument } from '@/lib/learning/course-report'
import {
  decideReportPublication,
  editorialProfileFromRow,
  emptyEditorialReportProfile,
  readPublicationStatus,
  reportFieldCompletion,
  reportProfilePatch,
  type EditorialReportProfile,
  type ReportPublicationStatus,
} from '@/lib/learning/course-report-publication'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PROFILE_COLUMNS =
  'course_id, overview, purpose, target_audience, entry_requirements, learning_objectives, learning_outcomes, delivery_method, workload_description, assessment_description, certification_description, additional_information, publication_status, published_at, updated_at'

const MIGRATION_MESSAGE =
  'Programme report storage is not ready. Run scripts/97-course-report-profiles.sql and scripts/98-course-report-publication.sql.'

export type ProgrammeReportListItem = {
  courseId: string
  title: string
  courseStatus: string
  publicationStatus: ReportPublicationStatus | 'missing'
  filled: number
  total: number
}

export type ProgrammeReportEditor = {
  courseId: string
  title: string
  courseStatus: string
  duration: string | null
  pricing: number | null
  publicationStatus: ReportPublicationStatus
  publishedAt: string | null
  updatedAt: string | null
  profile: EditorialReportProfile
  filled: number
  total: number
}

function storageMessage(message: string): string | null {
  if (/relation .* does not exist|could not find the table|could not find the .* column|column .* does not exist|schema cache/i.test(message)) {
    return MIGRATION_MESSAGE
  }
  return null
}

async function authorize() {
  const session = await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
  if (!supabaseAdmin) {
    throw new Error('Programme reports are temporarily unavailable.')
  }
  return { session, db: supabaseAdmin }
}

function denied(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : 'Forbidden'
  if (message === 'Unauthorized' || message === 'Forbidden') return { ok: false, error: message }
  return { ok: false, error: message || 'Programme reports are temporarily unavailable.' }
}

export async function listProgrammeReports(): Promise<
  { ok: true; courses: ProgrammeReportListItem[]; warning: string | null } | { ok: false; error: string }
> {
  try {
    const { db } = await authorize()
    const { data: courses, error } = await db
      .from('courses')
      .select('id, title, status')
      .order('title', { ascending: true })
    if (error) return { ok: false, error: error.message }

    const { data: profiles, error: profileError } = await db.from('course_report_profiles').select(PROFILE_COLUMNS)
    if (profileError) {
      const message = storageMessage(profileError.message)
      if (!message) return { ok: false, error: profileError.message }
      return {
        ok: true,
        warning: message,
        courses: (courses ?? []).map((course) => ({
          courseId: String(course.id),
          title: String(course.title ?? 'Programme'),
          courseStatus: String(course.status ?? 'draft'),
          publicationStatus: 'missing' as const,
          filled: 0,
          total: reportFieldCompletion(emptyEditorialReportProfile()).total,
        })),
      }
    }

    const byCourse = new Map((profiles ?? []).map((row) => [String(row.course_id), row as Record<string, unknown>]))
    return {
      ok: true,
      warning: null,
      courses: (courses ?? []).map((course) => {
        const row = byCourse.get(String(course.id)) ?? null
        const profile = editorialProfileFromRow(row)
        const completion = reportFieldCompletion(profile)
        return {
          courseId: String(course.id),
          title: String(course.title ?? 'Programme'),
          courseStatus: String(course.status ?? 'draft'),
          publicationStatus: row ? readPublicationStatus(row.publication_status) : 'missing',
          filled: row ? completion.filled : 0,
          total: completion.total,
        }
      }),
    }
  } catch (error) {
    return denied(error)
  }
}

export async function getProgrammeReportEditor(
  courseId: string
): Promise<{ ok: true; editor: ProgrammeReportEditor } | { ok: false; error: string }> {
  try {
    const { db } = await authorize()
    const { data: course, error } = await db
      .from('courses')
      .select('id, title, status, duration, pricing')
      .eq('id', courseId)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!course) return { ok: false, error: 'Course not found.' }

    const { data: row, error: profileError } = await db
      .from('course_report_profiles')
      .select(PROFILE_COLUMNS)
      .eq('course_id', courseId)
      .maybeSingle()
    if (profileError) return { ok: false, error: storageMessage(profileError.message) ?? profileError.message }

    const record = (row ?? null) as Record<string, unknown> | null
    const profile = editorialProfileFromRow(record)
    const completion = reportFieldCompletion(profile)
    return {
      ok: true,
      editor: {
        courseId: String(course.id),
        title: String(course.title ?? 'Programme'),
        courseStatus: String(course.status ?? 'draft'),
        duration: course.duration ? String(course.duration) : null,
        pricing: course.pricing == null ? null : Number(course.pricing),
        publicationStatus: readPublicationStatus(record?.publication_status),
        publishedAt: record?.published_at ? String(record.published_at) : null,
        updatedAt: record?.updated_at ? String(record.updated_at) : null,
        profile,
        filled: record ? completion.filled : 0,
        total: completion.total,
      },
    }
  } catch (error) {
    return denied(error)
  }
}

async function writeProfile(
  courseId: string,
  patch: Record<string, string | null>,
  publication: { status: ReportPublicationStatus; publishedAt: string | null } | null
) {
  const { session, db } = await authorize()
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    ...patch,
    course_id: courseId,
    updated_at: now,
    updated_by: session.user.id,
  }
  if (publication) {
    payload.publication_status = publication.status
    payload.published_at = publication.publishedAt
  }

  const { error } = await db.from('course_report_profiles').upsert(payload, { onConflict: 'course_id' })
  if (error) {
    throw new Error(storageMessage(error.message) ?? error.message)
  }
}

export async function saveProgrammeReport(
  courseId: string,
  input: object
): Promise<{ ok: true; editor: ProgrammeReportEditor } | { ok: false; error: string }> {
  try {
    await authorize()
    const parsed = reportProfilePatch(input)
    if (!parsed.ok) return parsed
    const existing = await getProgrammeReportEditor(courseId)
    if (!existing.ok) return existing
    const decision = decideReportPublication(parsed.profile, existing.editor.publicationStatus === 'published' ? 'published' : 'draft')
    if (!decision.ok && existing.editor.publicationStatus === 'published') {
      return {
        ok: false,
        error: `This report is published. Add ${decision.missing.join(', ')} or unpublish it before clearing required fields.`,
      }
    }
    await writeProfile(courseId, parsed.patch, null)
    return getProgrammeReportEditor(courseId)
  } catch (error) {
    return denied(error)
  }
}

export async function publishProgrammeReport(
  courseId: string
): Promise<{ ok: true; editor: ProgrammeReportEditor } | { ok: false; error: string }> {
  try {
    await authorize()
    const existing = await getProgrammeReportEditor(courseId)
    if (!existing.ok) return existing
    const decision = decideReportPublication(existing.editor.profile, 'published')
    if (!decision.ok) {
      return { ok: false, error: `Add ${decision.missing.join(', ')} before publishing.` }
    }
    await writeProfile(courseId, {}, { status: 'published', publishedAt: new Date().toISOString() })
    return getProgrammeReportEditor(courseId)
  } catch (error) {
    return denied(error)
  }
}

export async function unpublishProgrammeReport(
  courseId: string
): Promise<{ ok: true; editor: ProgrammeReportEditor } | { ok: false; error: string }> {
  try {
    await authorize()
    const existing = await getProgrammeReportEditor(courseId)
    if (!existing.ok) return existing
    if (existing.editor.updatedAt == null && existing.editor.filled === 0 && existing.editor.publicationStatus === 'draft') {
      return { ok: false, error: 'Save the report before changing publication.' }
    }
    await writeProfile(courseId, {}, { status: 'draft', publishedAt: null })
    return getProgrammeReportEditor(courseId)
  } catch (error) {
    return denied(error)
  }
}

export async function loadAdminProgrammeReportPreview(courseId: string) {
  try {
    await authorize()
    const preview = await loadCourseReportPreviewDocument(courseId)
    if (!preview.ok) return { ok: false as const, error: preview.message }
    return { ok: true as const, preview: preview.preview }
  } catch (error) {
    return denied(error)
  }
}
