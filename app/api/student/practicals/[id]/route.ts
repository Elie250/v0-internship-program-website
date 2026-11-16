import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getPracticalAssessment,
  getStudentPracticalSubmission,
} from '@/lib/learning/practical-assessment-service'

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { id: assessmentId } = await params
  const { assessment, error } = await getPracticalAssessment(assessmentId)
  if (error) return NextResponse.json({ error }, { status: 503 })
  if (!assessment || !assessment.is_published) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', assessment.course_id)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  // GET must not create a draft — only return existing submission or null.
  const { submission, error: subError } = await getStudentPracticalSubmission({
    assessmentId,
    enrollmentId: enrollment.id,
  })
  if (subError) return NextResponse.json({ error: subError }, { status: 500 })

  const showScores =
    submission?.practical_status === 'graded' || submission?.practical_status === 'returned'

  return NextResponse.json({
    assessment: {
      id: assessment.id,
      course_id: assessment.course_id,
      title: assessment.title,
      description: assessment.description,
      kind: assessment.assessment_kind,
      kind_label: assessment.kind_label,
      delivery_mode: assessment.delivery_mode,
      passing_score: assessment.passing_score,
      due_at: assessment.due_at,
      practical_brief: assessment.practical_brief,
      rubric: assessment.rubric
        ? {
            id: assessment.rubric.id,
            title: assessment.rubric.title,
            criteria: assessment.rubric.criteria.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              max_points: c.max_points,
              sort_order: c.sort_order,
              levels: c.levels.map((l) => ({
                id: l.id,
                label: l.label,
                description: l.description,
                points: l.points,
                sort_order: l.sort_order,
              })),
            })),
          }
        : null,
    },
    submission: submission
      ? {
          id: submission.id,
          practical_status: submission.practical_status,
          student_notes: submission.student_notes,
          feedback_summary: showScores ? submission.feedback_summary : null,
          score: showScores ? submission.score : null,
          passed: showScores ? submission.passed : null,
          practical_percent: showScores ? submission.practical_percent : null,
          artifacts: submission.artifacts.map((a) => {
            const editable =
              submission.practical_status == null ||
              submission.practical_status === 'draft' ||
              submission.practical_status === 'returned'
            return {
              id: a.id,
              file_name: a.file_name,
              content_type: a.content_type,
              byte_size: a.byte_size,
              label: a.label,
              // storage_key only while the owner may revise — never expose public CDN URLs.
              ...(editable && a.storage_key ? { storage_key: a.storage_key } : {}),
              download_path: `/api/student/practicals/${assessmentId}/artifacts/${a.id}`,
              sort_order: a.sort_order,
            }
          }),
          criterion_scores: showScores ? submission.criterion_scores : [],
          submitted_at: submission.submitted_at,
        }
      : null,
  })
}
