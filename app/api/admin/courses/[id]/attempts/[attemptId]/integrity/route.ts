import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { getCurrentUser } from '@/app/actions/auth-service'
import {
  getLecturerIntegrityReport,
  recordAssessmentIntegrityReview,
  voidAssessmentAttempt,
} from '@/lib/learning/assessment-integrity-report'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const { id: courseId, attemptId } = await params
    const report = await getLecturerIntegrityReport({ attemptId, courseId })
    if (report.error) return NextResponse.json({ error: report.error }, { status: 404 })
    return NextResponse.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const user = await getCurrentUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: courseId, attemptId } = await params
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
      message: 'Integrity decision recorded. Score and attempt status were not changed automatically.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
