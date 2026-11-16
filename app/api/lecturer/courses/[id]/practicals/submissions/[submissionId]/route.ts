import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { markPracticalSubmission } from '@/lib/learning/practical-assessment-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: courseId, submissionId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    const body = await request.json().catch(() => ({}))

    const action = body.action === 'return' ? 'return' : 'grade'
    const criterionScores = Array.isArray(body.criterion_scores)
      ? body.criterion_scores
      : Array.isArray(body.criterionScores)
        ? body.criterionScores
        : []

    if (!criterionScores.length) {
      return NextResponse.json({ error: 'Criterion scores are required' }, { status: 400 })
    }

    const result = await markPracticalSubmission({
      courseId,
      submissionId,
      graderUserId: user.id,
      action,
      feedbackSummary: body.feedback_summary ?? body.feedbackSummary ?? null,
      criterionScores: criterionScores.map(
        (row: {
          criterionId?: string
          criterion_id?: string
          pointsAwarded?: number
          points_awarded?: number
          levelId?: string | null
          level_id?: string | null
          comment?: string
        }) => ({
          criterionId: String(row.criterionId ?? row.criterion_id ?? ''),
          pointsAwarded: Number(row.pointsAwarded ?? row.points_awarded ?? 0),
          levelId: row.levelId ?? row.level_id ?? null,
          comment: row.comment ?? '',
        })
      ),
    })

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ submission: result.submission })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark submission'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
