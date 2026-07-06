import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'
import { queryCourseQuizStandings } from '@/lib/learning/quiz'

const MISSING = /relation .* does not exist|could not find the table/i

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET() {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { data: enrollments } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, course_id, status, course:courses(id, title)')
    .eq('user_id', user.id)
    .eq('status', 'admitted')

  const courses: Array<{
    courseId: string
    courseTitle: string
    enrollmentId: string
    progressPercent: number
    completedLessons: number
    totalLessons: number
    quizzes: Array<{
      title: string
      score: number | null
      passed: boolean
      attemptCount: number
    }>
    averageScore: number | null
    attendancePresent: number
    attendanceTotal: number
    certificateStatus: string | null
    certificateCode: string | null
  }> = []

  for (const row of enrollments ?? []) {
    const course = Array.isArray(row.course) ? row.course[0] : row.course
    const courseId = String(row.course_id)
    const courseTitle = course?.title ?? 'Programme'

    const [progressMap, quizResult] = await Promise.all([
      queryCourseProgressForStudents(courseId, [user.id]),
      queryCourseQuizStandings(courseId),
    ])

    const progress = progressMap.get(user.id)
    const standing = quizResult.standings.find((s) => s.enrollmentId === row.id)

    let attendancePresent = 0
    let attendanceTotal = 0
    const { data: attendanceRows, error: attError } = await supabaseAdmin
      .from('course_session_attendance')
      .select('status')
      .eq('enrollment_id', row.id)

    if (!attError || MISSING.test(attError.message)) {
      attendanceTotal = attendanceRows?.length ?? 0
      attendancePresent =
        attendanceRows?.filter((a) => a.status === 'present').length ?? 0
    }

    courses.push({
      courseId,
      courseTitle,
      enrollmentId: row.id,
      progressPercent: progress?.percent ?? 0,
      completedLessons: progress?.completed ?? 0,
      totalLessons: progress?.total ?? 0,
      quizzes: (standing?.submissions ?? []).map((s) => ({
        title: s.assessmentTitle,
        score: s.score,
        passed: s.passed,
        attemptCount: s.attemptCount,
      })),
      averageScore: standing?.averageScore ?? null,
      attendancePresent,
      attendanceTotal,
      certificateStatus: standing?.certificateStatus ?? null,
      certificateCode: standing?.certificateCode ?? null,
    })
  }

  return NextResponse.json({ courses })
}
