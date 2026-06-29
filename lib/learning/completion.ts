import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateCertificateId } from '@/lib/certificate-template'
import { sendCertificateIssuedEmail } from '@/lib/email/enrollment-notifications'

export async function submitAssessmentScore(input: {
  enrollmentId: string
  userId: string
  score: number
}): Promise<{ success: boolean; error?: string; passed?: boolean }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const score = Math.max(0, Math.min(100, Math.round(input.score)))
  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, course_id, user_id, status')
    .eq('id', input.enrollmentId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!enrollment || enrollment.status !== 'admitted') {
    return { success: false, error: 'Enrollment not found or not active' }
  }

  const { data: assessment } = await supabaseAdmin
    .from('course_assessments')
    .select('id, passing_score')
    .eq('course_id', enrollment.course_id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  let assessmentId = assessment?.id
  let passingScore = Number(assessment?.passing_score ?? 70)

  if (!assessmentId) {
    const { data: created, error: createError } = await supabaseAdmin
      .from('course_assessments')
      .insert([
        {
          course_id: enrollment.course_id,
          title: 'Final assessment',
          passing_score: 70,
          sort_order: 0,
        },
      ])
      .select('id, passing_score')
      .single()

    if (createError) {
      if (createError.message.includes('course_assessments')) {
        return {
          success: false,
          error: 'Assessment tables not ready. Run scripts/22-learning-lifecycle.sql in Supabase.',
        }
      }
      return { success: false, error: createError.message }
    }
    assessmentId = created.id
    passingScore = Number(created.passing_score ?? 70)
  }

  const passed = score >= passingScore

  const { error } = await supabaseAdmin.from('assessment_submissions').upsert(
    [
      {
        assessment_id: assessmentId,
        enrollment_id: enrollment.id,
        user_id: input.userId,
        score,
        passed,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'assessment_id,enrollment_id' }
  )

  if (error) {
    if (error.message.includes('assessment_submissions')) {
      return {
        success: false,
        error: 'Assessment tables not ready. Run scripts/22-learning-lifecycle.sql in Supabase.',
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, passed }
}

export async function setLecturerAssessmentApproval(input: {
  submissionId: string
  approved: boolean
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('assessment_submissions')
    .update({
      lecturer_approved: input.approved,
      lecturer_notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.submissionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function confirmAssessmentAndIssueCertificate(input: {
  submissionId: string
  adminUserId?: string | null
}): Promise<{ success: boolean; error?: string; certificateCode?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: submission } = await supabaseAdmin
    .from('assessment_submissions')
    .select('*, enrollment:course_enrollments(*, course:courses(title, pricing))')
    .eq('id', input.submissionId)
    .maybeSingle()

  if (!submission?.passed || !submission.lecturer_approved) {
    return { success: false, error: 'Student must pass the test and receive lecturer approval first' }
  }

  const enrollment = submission.enrollment as {
    id: string
    applicant_name: string
    applicant_email: string
    user_id: string | null
    course_id: string
    amount_due: number
    course: { title: string; pricing: number | null } | null
  } | null

  if (!enrollment) return { success: false, error: 'Enrollment not found' }

  const isPaid = Number(enrollment.amount_due ?? enrollment.course?.pricing ?? 0) > 0
  if (!isPaid) {
    return { success: false, error: 'Certificates are issued for paid programmes only' }
  }

  const { error: confirmError } = await supabaseAdmin
    .from('assessment_submissions')
    .update({
      admin_confirmed: true,
      admin_notes: 'Confirmed by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.submissionId)

  if (confirmError) return { success: false, error: confirmError.message }

  const { data: existing } = await supabaseAdmin
    .from('student_certificates')
    .select('certificate_code')
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  if (existing?.certificate_code) {
    return { success: true, certificateCode: existing.certificate_code }
  }

  const certificateCode = generateCertificateId()
  const programTitle = enrollment.course?.title ?? 'Engineering Programme'

  const { error: certError } = await supabaseAdmin.from('student_certificates').insert([
    {
      enrollment_id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      certificate_code: certificateCode,
      student_name: enrollment.applicant_name,
      program_title: programTitle,
      issued_by: input.adminUserId ?? null,
    },
  ])

  if (certError) {
    if (certError.message.includes('student_certificates')) {
      return {
        success: false,
        error: 'Certificate tables not ready. Run scripts/22-learning-lifecycle.sql in Supabase.',
      }
    }
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
