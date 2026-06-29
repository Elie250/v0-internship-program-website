import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type LearningApplicationRow = {
  enrollmentId: string
  status: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  motivation: string | null
  amountDue: number
  rejectionReason: string | null
  createdAt: string
  admittedAt: string | null
  accessStartsAt: string | null
  accessEndsAt: string | null
  course: {
    id: string
    title: string
    duration: string | null
    pricing: number | null
    program_type: string | null
    scheduled_at: string | null
  } | null
  payment: {
    id: string
    amount: number
    status: string
    receiptUrl: string | null
    receiptNumber: string | null
    adminNotes: string | null
    createdAt: string
  } | null
}

export async function queryLearningApplications(filter: 'pending' | 'history' | 'all' = 'pending'): Promise<{
  rows: LearningApplicationRow[]
  error?: string
}> {
  if (!supabaseAdmin) return { rows: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('course_enrollments')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.eq('status', 'payment_pending_review')
  } else if (filter === 'history') {
    query = query.in('status', ['admitted', 'payment_rejected', 'cancelled', 'refunded'])
  }

  const { data: enrollments, error } = await query.limit(200)
  if (error) return { rows: [], error: error.message }

  const courseIds = [...new Set((enrollments ?? []).map((e) => e.course_id).filter(Boolean))]
  const enrollmentIds = (enrollments ?? []).map((e) => e.id)

  let coursesById = new Map<string, LearningApplicationRow['course']>()
  if (courseIds.length) {
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, title, duration, pricing, program_type, scheduled_at')
      .in('id', courseIds)
    coursesById = new Map(
      (courses ?? []).map((c) => [
        c.id,
        {
          id: c.id,
          title: c.title,
          duration: c.duration,
          pricing: c.pricing,
          program_type: c.program_type ?? null,
          scheduled_at: c.scheduled_at ?? null,
        },
      ])
    )
  }

  let paymentsByEnrollment = new Map<string, LearningApplicationRow['payment']>()
  if (enrollmentIds.length) {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('id, amount, status, receipt_url, receipt_number, admin_notes, created_at, course_enrollment_id')
      .in('course_enrollment_id', enrollmentIds)
      .order('created_at', { ascending: false })

    for (const p of payments ?? []) {
      if (!p.course_enrollment_id || paymentsByEnrollment.has(p.course_enrollment_id)) continue
      paymentsByEnrollment.set(p.course_enrollment_id, {
        id: p.id,
        amount: Number(p.amount ?? 0),
        status: p.status,
        receiptUrl: p.receipt_url,
        receiptNumber: p.receipt_number,
        adminNotes: p.admin_notes,
        createdAt: p.created_at,
      })
    }
  }

  const rows: LearningApplicationRow[] = (enrollments ?? []).map((e) => ({
    enrollmentId: e.id,
    status: e.status,
    applicantName: e.applicant_name,
    applicantEmail: e.applicant_email,
    applicantPhone: e.applicant_phone,
    motivation: e.motivation,
    amountDue: Number(e.amount_due ?? 0),
    rejectionReason: e.rejection_reason ?? null,
    createdAt: e.created_at,
    admittedAt: e.admitted_at ?? null,
    accessStartsAt: e.access_starts_at ?? null,
    accessEndsAt: e.access_ends_at ?? null,
    course: e.course_id ? coursesById.get(e.course_id) ?? null : null,
    payment: paymentsByEnrollment.get(e.id) ?? null,
  }))

  return { rows }
}
