import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateCertificateId } from '@/lib/certificate-template'
import { sendCertificateIssuedEmail } from '@/lib/email/enrollment-notifications'

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
  sort_order: number
}

export type Quiz = {
  id: string
  course_id: string
  title: string
  description: string | null
  passing_score: number
  sort_order: number
  is_published: boolean
  questions: QuizQuestion[]
}

function isMissingTable(message: string | undefined): boolean {
  const msg = message ?? ''
  return (
    (msg.includes('assessment_questions') || msg.includes('answers') || msg.includes('correct_count')) &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  )
}

export const QUIZ_TABLES_HINT =
  'Quiz tables not ready. Run scripts/27-quiz-assessments.sql in Supabase.'

export async function queryCourseQuizzes(
  courseId: string,
  opts: { includeAnswers: boolean; publishedOnly?: boolean }
): Promise<{ quizzes: Quiz[]; error?: string }> {
  if (!supabaseAdmin) return { quizzes: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('course_assessments')
    .select('id, course_id, title, description, passing_score, sort_order, is_published')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  const { data: assessments, error } = await query
  if (error) return { quizzes: [], error: error.message }

  let rows = assessments ?? []
  if (opts.publishedOnly) {
    rows = rows.filter((row) => row.is_published !== false)
  }
  if (!rows.length) return { quizzes: [] }

  const { data: questions, error: qError } = await supabaseAdmin
    .from('assessment_questions')
    .select('id, assessment_id, question, options, correct_index, explanation, sort_order')
    .in('assessment_id', rows.map((r) => r.id))
    .order('sort_order', { ascending: true })

  if (qError) {
    if (isMissingTable(qError.message)) {
      return {
        quizzes: rows.map((row) => ({
          ...row,
          is_published: row.is_published !== false,
          questions: [],
        })),
      }
    }
    return { quizzes: [], error: qError.message }
  }

  const byAssessment = new Map<string, QuizQuestion[]>()
  for (const q of questions ?? []) {
    const list = byAssessment.get(String(q.assessment_id)) ?? []
    list.push({
      id: q.id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct_index: opts.includeAnswers ? Number(q.correct_index) : -1,
      explanation: opts.includeAnswers ? (q.explanation ?? null) : null,
      sort_order: Number(q.sort_order ?? 0),
    })
    byAssessment.set(String(q.assessment_id), list)
  }

  return {
    quizzes: rows.map((row) => ({
      ...row,
      is_published: row.is_published !== false,
      questions: byAssessment.get(String(row.id)) ?? [],
    })),
  }
}

export type GradedAnswer = {
  questionId: string
  question: string
  options: string[]
  chosenIndex: number
  correctIndex: number
  correct: boolean
  explanation: string | null
}

export async function gradeQuizSubmission(input: {
  assessmentId: string
  userId: string
  answers: Record<string, number>
}): Promise<
  | {
      success: true
      score: number
      passed: boolean
      correctCount: number
      totalQuestions: number
      attemptCount: number
      results: GradedAnswer[]
    }
  | { success: false; error: string }
> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('id, course_id, passing_score, is_published')
    .eq('id', input.assessmentId)
    .maybeSingle()

  if (!assessment || assessment.is_published === false) {
    return { success: false, error: 'Assessment not found' }
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('course_id', assessment.course_id)
    .eq('user_id', input.userId)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) {
    return { success: false, error: 'You are not admitted to this programme' }
  }

  const { data: questions, error: qError } = await supabaseAdmin
    .from('assessment_questions')
    .select('id, question, options, correct_index, explanation, sort_order')
    .eq('assessment_id', input.assessmentId)
    .order('sort_order', { ascending: true })

  if (qError) {
    return { success: false, error: isMissingTable(qError.message) ? QUIZ_TABLES_HINT : qError.message }
  }
  if (!questions?.length) {
    return { success: false, error: 'This assessment has no questions yet' }
  }

  const results: GradedAnswer[] = questions.map((q) => {
    const chosen = Number(input.answers[String(q.id)])
    const chosenIndex = Number.isInteger(chosen) ? chosen : -1
    const correctIndex = Number(q.correct_index)
    return {
      questionId: String(q.id),
      question: q.question,
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      chosenIndex,
      correctIndex,
      correct: chosenIndex === correctIndex,
      explanation: q.explanation ?? null,
    }
  })

  const correctCount = results.filter((r) => r.correct).length
  const totalQuestions = results.length
  const score = Math.round((correctCount / totalQuestions) * 100)
  const passingScore = Number(assessment.passing_score ?? 70)
  const passed = score >= passingScore

  const { data: existing } = await supabaseAdmin
    .from('assessment_submissions')
    .select('id, attempt_count')
    .eq('assessment_id', input.assessmentId)
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  const attemptCount = (Number(existing?.attempt_count) || 0) + 1
  const now = new Date().toISOString()

  const { error: upsertError } = await supabaseAdmin.from('assessment_submissions').upsert(
    [
      {
        assessment_id: input.assessmentId,
        enrollment_id: enrollment.id,
        user_id: input.userId,
        score,
        passed,
        answers: input.answers,
        correct_count: correctCount,
        total_questions: totalQuestions,
        attempt_count: attemptCount,
        submitted_at: now,
        updated_at: now,
      },
    ],
    { onConflict: 'assessment_id,enrollment_id' }
  )

  if (upsertError) {
    return {
      success: false,
      error: isMissingTable(upsertError.message) ? QUIZ_TABLES_HINT : upsertError.message,
    }
  }

  return { success: true, score, passed, correctCount, totalQuestions, attemptCount, results }
}

export type StudentQuizStanding = {
  enrollmentId: string
  userId: string | null
  name: string
  email: string
  submissions: Array<{
    assessmentId: string
    assessmentTitle: string
    score: number | null
    passed: boolean
    attemptCount: number
    submittedAt: string | null
  }>
  completedQuizzes: number
  totalQuizzes: number
  averageScore: number | null
  eligible: boolean
  certificateCode: string | null
}

/** Roster with per-quiz scores and average; eligible = all published quizzes taken and average >= pass mark. */
export async function queryCourseQuizStandings(
  courseId: string
): Promise<{ standings: StudentQuizStanding[]; passingScore: number; error?: string }> {
  if (!supabaseAdmin) return { standings: [], passingScore: 70, error: 'Database not configured' }

  const { quizzes, error: quizError } = await queryCourseQuizzes(courseId, {
    includeAnswers: false,
    publishedOnly: true,
  })
  if (quizError) return { standings: [], passingScore: 70, error: quizError }

  const gradedQuizzes = quizzes.filter((q) => q.questions.length > 0)
  const passingScore = gradedQuizzes.length
    ? Math.round(
        gradedQuizzes.reduce((sum, q) => sum + Number(q.passing_score ?? 70), 0) /
          gradedQuizzes.length
      )
    : 70

  const { data: enrollments, error: enrollError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, user_id, applicant_name, applicant_email, status')
    .eq('course_id', courseId)
    .eq('status', 'admitted')
    .order('applicant_name', { ascending: true })

  if (enrollError) return { standings: [], passingScore, error: enrollError.message }

  const enrollmentIds = (enrollments ?? []).map((e) => e.id)
  const quizIds = gradedQuizzes.map((q) => q.id)

  let submissions: Array<Record<string, unknown>> = []
  if (enrollmentIds.length && quizIds.length) {
    const { data } = await supabaseAdmin
      .from('assessment_submissions')
      .select('assessment_id, enrollment_id, score, passed, attempt_count, submitted_at')
      .in('assessment_id', quizIds)
      .in('enrollment_id', enrollmentIds)
    submissions = data ?? []
  }

  let certificates: Array<{ enrollment_id: string; certificate_code: string }> = []
  if (enrollmentIds.length) {
    const { data } = await supabaseAdmin
      .from('student_certificates')
      .select('enrollment_id, certificate_code')
      .in('enrollment_id', enrollmentIds)
    certificates = (data ?? []) as typeof certificates
  }

  const certByEnrollment = new Map(certificates.map((c) => [String(c.enrollment_id), c.certificate_code]))
  const quizTitleById = new Map(gradedQuizzes.map((q) => [q.id, q.title]))

  const standings: StudentQuizStanding[] = (enrollments ?? []).map((enrollment) => {
    const mine = submissions.filter((s) => String(s.enrollment_id) === String(enrollment.id))
    const subs = gradedQuizzes.map((quiz) => {
      const sub = mine.find((s) => String(s.assessment_id) === quiz.id)
      return {
        assessmentId: quiz.id,
        assessmentTitle: quizTitleById.get(quiz.id) ?? 'Quiz',
        score: sub ? Number(sub.score) : null,
        passed: Boolean(sub?.passed),
        attemptCount: Number(sub?.attempt_count ?? 0),
        submittedAt: (sub?.submitted_at as string | null) ?? null,
      }
    })

    const taken = subs.filter((s) => s.score != null)
    const averageScore = taken.length
      ? Math.round(taken.reduce((sum, s) => sum + Number(s.score), 0) / taken.length)
      : null

    const eligible =
      gradedQuizzes.length > 0 &&
      taken.length === gradedQuizzes.length &&
      averageScore != null &&
      averageScore >= passingScore

    return {
      enrollmentId: enrollment.id,
      userId: (enrollment.user_id as string | null) ?? null,
      name: enrollment.applicant_name,
      email: enrollment.applicant_email,
      submissions: subs,
      completedQuizzes: taken.length,
      totalQuizzes: gradedQuizzes.length,
      averageScore,
      eligible,
      certificateCode: certByEnrollment.get(String(enrollment.id)) ?? null,
    }
  })

  return { standings, passingScore }
}

/** Lecturer confirms a passing average → certificate is generated and emailed. */
export async function certifyStudentCompletion(input: {
  courseId: string
  enrollmentId: string
  issuedBy?: string | null
}): Promise<{ success: boolean; error?: string; certificateCode?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { standings, passingScore, error } = await queryCourseQuizStandings(input.courseId)
  if (error) return { success: false, error }

  const standing = standings.find((s) => s.enrollmentId === input.enrollmentId)
  if (!standing) return { success: false, error: 'Student not found in this programme' }

  if (standing.certificateCode) {
    return { success: true, certificateCode: standing.certificateCode }
  }

  if (!standing.eligible || standing.averageScore == null) {
    return {
      success: false,
      error: `Student must complete all assessments with an average of at least ${passingScore}%`,
    }
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, user_id, course_id, applicant_name, applicant_email, course:courses(title)')
    .eq('id', input.enrollmentId)
    .maybeSingle()

  if (!enrollment) return { success: false, error: 'Enrollment not found' }

  const course = enrollment.course as { title?: string } | { title?: string }[] | null
  const programTitle =
    (Array.isArray(course) ? course[0]?.title : course?.title) ?? 'Engineering Programme'
  const certificateCode = generateCertificateId()

  const insertPayload: Record<string, unknown> = {
    enrollment_id: enrollment.id,
    user_id: enrollment.user_id,
    course_id: enrollment.course_id,
    certificate_code: certificateCode,
    student_name: enrollment.applicant_name,
    program_title: programTitle,
    issued_by: input.issuedBy ?? null,
    final_score: standing.averageScore,
  }

  let { error: certError } = await supabaseAdmin.from('student_certificates').insert([insertPayload])

  if (certError?.message?.includes('final_score')) {
    const { final_score: _omit, ...fallback } = insertPayload
    const retry = await supabaseAdmin.from('student_certificates').insert([fallback])
    certError = retry.error
  }

  if (certError) {
    return { success: false, error: certError.message }
  }

  if (enrollment.applicant_email) {
    void sendCertificateIssuedEmail({
      to: enrollment.applicant_email,
      studentName: enrollment.applicant_name,
      programTitle,
      certificateCode,
    })
  }

  return { success: true, certificateCode }
}
