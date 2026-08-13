import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import {
  getLecturerIntegrityReport,
  recordAssessmentIntegrityReview,
  voidAssessmentAttempt,
} from '@/lib/learning/assessment-integrity-report'
import { studentMayReadIntegrityBand } from '@/lib/integrity/validate'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    const { id: courseId, attemptId } = await params
    await requireLecturerCourseAccess(courseId)

    // Invariant: this is a staff route; student APIs must never expose bands
    void studentMayReadIntegrityBand()

    const report = await getLecturerIntegrityReport({ attemptId, courseId })
    if (report.error) {
      return NextResponse.json({ error: report.error }, { status: 404 })
    }
    return NextResponse.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    const { id: courseId, attemptId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    const body = await request.json()
    const action = String(body.action ?? 'review')

    if (action === 'void') {
      const result = await voidAssessmentAttempt({
        attemptId,
        courseId,
        actorUserId: user.id,
        reason: body.reason != null ? String(body.reason) : null,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        attempt: result.attempt,
        message: 'Attempt voided manually. Score was not rewritten by integrity logic.',
      })
    }

    const result = await recordAssessmentIntegrityReview({
      attemptId,
      courseId,
      reviewerUserId: user.id,
      outcome: String(body.outcome ?? ''),
      notes: body.notes != null ? String(body.notes) : null,
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      review: result.review,
      message:
        'Integrity decision recorded. Score and attempt status were not changed automatically.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
