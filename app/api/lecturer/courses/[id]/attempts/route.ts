import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** List recent assessment attempts with advisory integrity bands. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: assessments } = await supabaseAdmin
      .from('course_assessments')
      .select('id, title')
      .eq('course_id', courseId)

    const assessmentIds = (assessments ?? []).map((a) => a.id)
    if (!assessmentIds.length) return NextResponse.json({ attempts: [] })

    const titleById = new Map((assessments ?? []).map((a) => [a.id, a.title]))

    const { data: attempts, error } = await supabaseAdmin
      .from('assessment_attempts')
      .select(
        'id, assessment_id, user_id, status, score, passed, attempt_number, submitted_at, started_at, tab_switch_count, integrity_flags, integrity_band'
      )
      .in('assessment_id', assessmentIds)
      .in('status', ['submitted', 'voided', 'expired'])
      .order('submitted_at', { ascending: false })
      .limit(100)

    if (error) {
      if (error.message.includes('assessment_attempts') || error.message.includes('schema cache')) {
        return NextResponse.json({
          attempts: [],
          hint: 'Run scripts/35-assessment-integrity.sql and scripts/80-academy-assessment-integrity-bands.sql',
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = Array.from(new Set((attempts ?? []).map((a) => a.user_id)))
    const { data: users } = userIds.length
      ? await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
      : { data: [] }

    const userById = new Map((users ?? []).map((u) => [u.id, u]))

    return NextResponse.json({
      attempts: (attempts ?? []).map((row) => {
        const user = userById.get(row.user_id)
        return {
          id: row.id,
          assessmentId: row.assessment_id,
          assessmentTitle: titleById.get(row.assessment_id) ?? 'Assessment',
          status: row.status,
          score: row.score,
          passed: row.passed,
          attemptNumber: row.attempt_number,
          submittedAt: row.submitted_at,
          startedAt: row.started_at,
          tabSwitchCount: row.tab_switch_count,
          integrityFlags: row.integrity_flags,
          integrityBand: row.integrity_band ?? null,
          studentName:
            [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
            user?.email ||
            'Student',
          studentEmail: user?.email ?? null,
        }
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
