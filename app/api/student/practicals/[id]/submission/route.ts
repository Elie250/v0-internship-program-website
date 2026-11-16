import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  ensureStudentPracticalDraft,
  getPracticalAssessment,
  saveStudentPracticalDraft,
  submitStudentPractical,
} from '@/lib/learning/practical-assessment-service'
import { isAuthorizedPracticalStorageKey } from '@/lib/learning/practical-upload'

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

async function loadOwnedContext(assessmentId: string, userId: string) {
  const { assessment, error } = await getPracticalAssessment(assessmentId)
  if (error) return { error, status: 503 as const }
  if (!assessment || !assessment.is_published) return { error: 'Assessment not found', status: 404 as const }

  const { data: enrollment } = await supabaseAdmin!
    .from('course_enrollments')
    .select('id')
    .eq('course_id', assessment.course_id)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()
  if (!enrollment) return { error: 'Not admitted', status: 403 as const }

  return { assessment, enrollment }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { id: assessmentId } = await params
  const owned = await loadOwnedContext(assessmentId, user.id)
  if ('error' in owned && owned.error && !('assessment' in owned)) {
    return NextResponse.json({ error: owned.error }, { status: owned.status })
  }
  if (!('assessment' in owned) || !owned.assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  // Drafts are created only on intentional write.
  const ensured = await ensureStudentPracticalDraft({
    assessmentId,
    enrollmentId: owned.enrollment.id,
    userId: user.id,
  })
  if (ensured.error || !ensured.submission) {
    return NextResponse.json({ error: ensured.error || 'Could not open draft' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const action = String(body.action ?? 'save')

  const artifactsRaw = Array.isArray(body.artifacts) ? body.artifacts : null
  if (artifactsRaw) {
    for (const artifact of artifactsRaw) {
      const storageKey = String(artifact.storage_key ?? artifact.storageKey ?? '')
      if (
        !isAuthorizedPracticalStorageKey(storageKey, {
          courseId: owned.assessment.course_id,
          assessmentId,
          userId: user.id,
        })
      ) {
        return NextResponse.json({ error: 'Invalid or unauthorized storage key' }, { status: 400 })
      }
    }
  }

  const mappedArtifacts = artifactsRaw
    ? artifactsRaw.map(
        (artifact: {
          storage_key?: string
          storageKey?: string
          file_name?: string
          fileName?: string
          content_type?: string
          contentType?: string
          byte_size?: number
          byteSize?: number
          label?: string
        }) => ({
          storage_key: String(artifact.storage_key ?? artifact.storageKey ?? ''),
          file_name: String(artifact.file_name ?? artifact.fileName ?? 'file'),
          content_type: String(artifact.content_type ?? artifact.contentType ?? 'application/octet-stream'),
          byte_size: Number(artifact.byte_size ?? artifact.byteSize ?? 0),
          label: String(artifact.label ?? ''),
        })
      )
    : undefined

  if (action === 'submit') {
    const result = await submitStudentPractical({
      submissionId: ensured.submission.id,
      courseId: owned.assessment.course_id,
      assessmentId,
      userId: user.id,
      studentNotes: body.student_notes ?? body.studentNotes,
      artifacts: mappedArtifacts,
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ submission: result.submission })
  }

  if (action === 'save' || artifactsRaw || body.student_notes != null || body.studentNotes != null) {
    const draft = await saveStudentPracticalDraft({
      submissionId: ensured.submission.id,
      courseId: owned.assessment.course_id,
      assessmentId,
      userId: user.id,
      studentNotes: body.student_notes ?? body.studentNotes,
      replaceArtifacts: artifactsRaw != null,
      artifacts: mappedArtifacts,
    })
    if (!draft.ok) return NextResponse.json({ error: draft.error }, { status: 400 })
    return NextResponse.json({ submission: draft.submission })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
