import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'
import { certifyStudentCompletion, queryCourseQuizStandings } from '@/lib/learning/quiz'

/**
 * When a student completes all lessons and quizzes with a passing average,
 * auto-create a pending_admin certificate (lecturer approval still required for issue).
 */
export async function maybeAutoRequestCertificate(input: {
  courseId: string
  enrollmentId: string
  userId: string
}): Promise<{ requested: boolean; certificateCode?: string; reason?: string }> {
  if (!supabaseAdmin) return { requested: false, reason: 'no_db' }

  const { standings } = await queryCourseQuizStandings(input.courseId)
  const standing = standings.find((s) => s.enrollmentId === input.enrollmentId)
  if (!standing) return { requested: false, reason: 'not_found' }
  if (standing.certificateCode) {
    return { requested: false, certificateCode: standing.certificateCode, reason: 'exists' }
  }
  if (!standing.eligible) return { requested: false, reason: 'not_eligible' }

  const progressMap = await queryCourseProgressForStudents(input.courseId, [input.userId])
  const progress = progressMap.get(input.userId)
  if (!progress || progress.percent < 100) {
    return { requested: false, reason: 'lessons_incomplete' }
  }

  const result = await certifyStudentCompletion({
    courseId: input.courseId,
    enrollmentId: input.enrollmentId,
    issuedBy: null,
  })

  if (!result.success) return { requested: false, reason: result.error }
  return { requested: true, certificateCode: result.certificateCode }
}
