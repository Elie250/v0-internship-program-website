import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission, getAdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { admitEnrollmentById, rejectEnrollmentById } from '@/lib/enrollment/admit'
import { revokeEnrollmentWithPayment } from '@/lib/admin/refund-payment'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'
import {
  approveEnrollmentPaymentRecord,
  resolveEnrollmentPaymentId,
} from '@/lib/payments/enrollment-payment'
import { isPendingPaymentStatus } from '@/lib/payments/status'

async function attachLearningProgress(
  rows: Array<{ course_id?: string | null; user_id?: string | null; status?: string }>
) {
  const admitted = rows.filter((r) => r.status === 'admitted' && r.course_id && r.user_id)
  const byCourse = new Map<string, string[]>()
  for (const row of admitted) {
    const courseId = String(row.course_id)
    const userId = String(row.user_id)
    if (!byCourse.has(courseId)) byCourse.set(courseId, [])
    byCourse.get(courseId)!.push(userId)
  }

  const progressByUserCourse = new Map<string, { percent: number; completed: number; total: number }>()
  for (const [courseId, userIds] of byCourse) {
    const map = await queryCourseProgressForStudents(courseId, [...new Set(userIds)])
    for (const [userId, progress] of map) {
      progressByUserCourse.set(`${courseId}:${userId}`, progress)
    }
  }

  return rows.map((row) => {
    if (row.status !== 'admitted' || !row.course_id || !row.user_id) {
      return { ...row, learningProgress: null }
    }
    const key = `${row.course_id}:${row.user_id}`
    return { ...row, learningProgress: progressByUserCourse.get(key) ?? null }
  })
}

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const courseIds = [...new Set((data ?? []).map((row) => row.course_id).filter(Boolean))]
    let coursesById = new Map<string, { id: string; title: string; pricing?: number }>()

    if (courseIds.length) {
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id, title, pricing')
        .in('id', courseIds)
      coursesById = new Map((courses ?? []).map((course) => [course.id, course]))
    }

    const rows = (data ?? []).map((row) => ({
      ...row,
      course: row.course_id ? coursesById.get(row.course_id) ?? null : null,
    }))

    const enrollmentIds = rows.map((row) => row.id)
    const paymentIds = [
      ...new Set(rows.map((row) => row.payment_id).filter(Boolean) as string[]),
    ]

    const paymentsByEnrollment = new Map<string, Record<string, unknown>>()
    const paymentsById = new Map<string, Record<string, unknown>>()

    if (paymentIds.length) {
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('id, amount, status, receipt_url, receipt_number, payment_method, admin_notes, course_enrollment_id')
        .in('id', paymentIds)

      for (const payment of payments ?? []) {
        paymentsById.set(payment.id, payment)
        if (payment.course_enrollment_id) {
          paymentsByEnrollment.set(payment.course_enrollment_id, payment)
        }
      }
    }

    if (enrollmentIds.length) {
      const { data: enrollmentPayments } = await supabaseAdmin
        .from('payments')
        .select('id, amount, status, receipt_url, receipt_number, payment_method, admin_notes, course_enrollment_id')
        .in('course_enrollment_id', enrollmentIds)

      for (const payment of enrollmentPayments ?? []) {
        if (payment.course_enrollment_id && !paymentsByEnrollment.has(payment.course_enrollment_id)) {
          paymentsByEnrollment.set(payment.course_enrollment_id, payment)
        }
      }
    }

    const withPayments = rows.map((row) => ({
      ...row,
      payment:
        (row.payment_id ? paymentsById.get(row.payment_id) : null) ??
        paymentsByEnrollment.get(row.id) ??
        null,
    }))

    const withProgress = await attachLearningProgress(withPayments)

    return NextResponse.json(withProgress)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load enrollments'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { id, status, adminNotes } = body
    if (!id || !status) {
      return NextResponse.json({ error: 'Enrollment id and status required' }, { status: 400 })
    }

    if (status === 'admitted') {
      const session = await getAdminSession()
      const paymentId = await resolveEnrollmentPaymentId(id)

      if (paymentId) {
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('status')
          .eq('id', paymentId)
          .maybeSingle()

        if (payment && isPendingPaymentStatus(String(payment.status))) {
          const approved = await approveEnrollmentPaymentRecord(paymentId, {
            adminNotes: adminNotes,
            reviewedBy: session?.user.id ?? null,
          })
          if (!approved.success) {
            return NextResponse.json({ error: approved.error }, { status: 500 })
          }
        }
      }

      const result = await admitEnrollmentById(id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      if (adminNotes?.trim()) {
        await supabaseAdmin
          .from('course_enrollments')
          .update({ admin_notes: adminNotes.trim(), updated_at: new Date().toISOString() })
          .eq('id', id)
      }
    } else if (status === 'payment_rejected') {
      const result = await rejectEnrollmentById(id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else if (status === 'refunded') {
      const result = await revokeEnrollmentWithPayment(id, {
        adminNotes: adminNotes?.trim(),
        deleteReceipt: body.deleteReceipt !== false,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else {
      const { error } = await supabaseAdmin
        .from('course_enrollments')
        .update({
          status,
          admin_notes: adminNotes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data, error: fetchError } = await supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    let course = null
    if (data?.course_id) {
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('id', data.course_id)
        .maybeSingle()
      course = courseRow
    }

    const paymentId = await resolveEnrollmentPaymentId(id)
    let payment = null
    if (paymentId) {
      const { data: paymentRow } = await supabaseAdmin
        .from('payments')
        .select('id, amount, status, receipt_url, receipt_number, payment_method, admin_notes')
        .eq('id', paymentId)
        .maybeSingle()
      payment = paymentRow
    }

    return NextResponse.json({ ...data, course, payment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update enrollment'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
