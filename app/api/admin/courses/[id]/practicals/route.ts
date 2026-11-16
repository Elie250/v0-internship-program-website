import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  listPracticalAssessments,
  listPracticalSubmissionsForCourse,
} from '@/lib/learning/practical-assessment-service'

/** Admin oversight: practical assessment publish state and marking completion. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const { id: courseId } = await params

    const [{ assessments, error }, { rows, error: subError }] = await Promise.all([
      listPracticalAssessments(courseId),
      listPracticalSubmissionsForCourse(courseId),
    ])

    if (error) return NextResponse.json({ error }, { status: 503 })
    if (subError) return NextResponse.json({ error: subError }, { status: 503 })

    const byAssessment = new Map<string, { submitted: number; graded: number; returned: number }>()
    for (const row of rows) {
      const stats = byAssessment.get(row.assessment_id) ?? {
        submitted: 0,
        graded: 0,
        returned: 0,
      }
      if (row.practical_status === 'submitted' || row.practical_status === 'resubmitted') {
        stats.submitted += 1
      }
      if (row.practical_status === 'graded') stats.graded += 1
      if (row.practical_status === 'returned') stats.returned += 1
      byAssessment.set(row.assessment_id, stats)
    }

    return NextResponse.json({
      assessments: assessments.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        kind: assessment.assessment_kind,
        kind_label: assessment.kind_label,
        is_published: assessment.is_published,
        delivery_mode: assessment.delivery_mode,
        outcome_count: assessment.outcome_ids.length,
        has_rubric: Boolean(assessment.rubric?.criteria.length),
        queue: byAssessment.get(assessment.id) ?? { submitted: 0, graded: 0, returned: 0 },
      })),
      note: 'Certificate eligibility remains quiz-based in Phase C1.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
