import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { PENDING_ENROLLMENT_STATUSES } from '@/lib/enrollment/constants'
import { getEnrollEligibility } from '@/lib/enrollment/eligibility'
import { admitEnrollmentById } from '@/lib/enrollment/admit'
import { isFreeProgram } from '@/lib/enrollment/program-types'
import {
  sendEnrollmentAdmittedEmail,
  sendPaymentSubmittedToAdmin,
} from '@/lib/email/notifications'

type SessionUser = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as SessionUser
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json(
        {
          error: 'Please log in or create an account before enrolling.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      )
    }

    if (sessionUser.role !== 'student' && sessionUser.role !== 'registered') {
      return NextResponse.json(
        {
          error: 'Course enrollment is for student accounts. Please register as a Student.',
          code: 'WRONG_ROLE',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const courseId = String(body.courseId ?? '').trim()
    const applicantPhone = String(body.applicantPhone ?? '').trim()
    const motivation = String(body.motivation ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    const applicantName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim()
    const applicantEmail = sessionUser.email.trim()

    if (!courseId || !applicantPhone) {
      return NextResponse.json(
        { error: 'Course and phone number are required' },
        { status: 400 }
      )
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, pricing, status, max_seats, program_type')
      .eq('id', courseId)
      .eq('status', 'published')
      .maybeSingle()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found or not open for enrollment' }, { status: 404 })
    }

    const amountDue = Number(course.pricing ?? 0)
    const isFree = isFreeProgram(amountDue)

    if (!isFree && !receiptUrl) {
      return NextResponse.json(
        { error: 'Upload your MoMo payment receipt before submitting' },
        { status: 400 }
      )
    }

    const { data: allEnrollmentRows } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, course_id, status, access_starts_at, access_ends_at, courses(program_type)')
      .eq('user_id', sessionUser.id)

    const eligibilityRows = (allEnrollmentRows ?? []).map((r: Record<string, unknown>) => {
      const courseRel = r.courses as { program_type?: string | null } | { program_type?: string | null }[] | null
      const programType = Array.isArray(courseRel)
        ? courseRel[0]?.program_type ?? null
        : courseRel?.program_type ?? null
      return {
        id: String(r.id ?? ''),
        course_id: String(r.course_id ?? ''),
        status: String(r.status ?? ''),
        access_starts_at: (r.access_starts_at as string | null) ?? null,
        access_ends_at: (r.access_ends_at as string | null) ?? null,
        program_type: programType,
      }
    })

    const eligibility = getEnrollEligibility(eligibilityRows, courseId, course.program_type)
    if (!eligibility.canEnroll) {
      return NextResponse.json(
        { error: eligibility.reason ?? 'You cannot enroll in this course right now.', code: 'ENROLLMENT_BLOCKED' },
        { status: 409 }
      )
    }

    const { data: existingRows } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('user_id', sessionUser.id)
      .order('created_at', { ascending: false })

    const existing = (existingRows ?? []).find(
      (row) => !['cancelled', 'payment_rejected'].includes(String(row.status))
    )

    if (existing) {
      const pending = PENDING_ENROLLMENT_STATUSES.includes(
        existing.status as (typeof PENDING_ENROLLMENT_STATUSES)[number]
      )
      return NextResponse.json(
        {
          error: pending
            ? 'You already have a pending enrollment for this course. Check your student dashboard.'
            : 'You are already enrolled in this course.',
          code: 'DUPLICATE_ENROLLMENT',
        },
        { status: 409 }
      )
    }

    if (course.max_seats) {
      const { count } = await supabaseAdmin
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', 'admitted')

      if ((count ?? 0) >= course.max_seats) {
        return NextResponse.json(
          { error: 'This course cohort is full. Contact us to join the waitlist.', code: 'COHORT_FULL' },
          { status: 409 }
        )
      }
    }

    const amountDueFinal = Number(course.pricing ?? 0)

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .insert([
        {
          course_id: course.id,
          user_id: sessionUser.id,
          applicant_name: applicantName || applicantEmail,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone,
          motivation: motivation || null,
          amount_due: amountDueFinal,
          status: isFree ? 'admitted' : 'payment_pending_review',
        },
      ])
      .select()
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: enrollmentError?.message || 'Failed to create enrollment' },
        { status: 500 }
      )
    }

    if (isFree) {
      const admitted = await admitEnrollmentById(enrollment.id)
      if (!admitted.success) {
        await supabaseAdmin.from('course_enrollments').delete().eq('id', enrollment.id)
        return NextResponse.json(
          { error: admitted.error || 'Failed to activate free enrollment' },
          { status: 500 }
        )
      }

      if (applicantPhone) {
        await supabaseAdmin
          .from('users')
          .update({ phone: applicantPhone, updated_at: new Date().toISOString() })
          .eq('id', sessionUser.id)
      }

      void sendEnrollmentAdmittedEmail({
        to: applicantEmail,
        studentName: applicantName || applicantEmail,
        courseTitle: course.title,
      })

      return NextResponse.json(
        {
          success: true,
          enrollmentId: enrollment.id,
          courseTitle: course.title,
          amountDue: amountDueFinal,
          instantAccess: true,
          message:
            'You are enrolled! This free programme is now available on your student dashboard.',
        },
        { status: 201 }
      )
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: amountDueFinal,
          payer_name: applicantName || applicantEmail,
          payer_email: applicantEmail,
          payer_phone: applicantPhone,
          payment_method: 'MTN MoMo',
          receipt_url: receiptUrl,
          receipt_number: receiptNumber || null,
          course_enrollment_id: enrollment.id,
          course_id: course.id,
          status: 'pending_review',
        },
      ])
      .select()
      .single()

    if (paymentError || !payment) {
      await supabaseAdmin.from('course_enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json(
        { error: paymentError?.message || 'Failed to submit payment receipt' },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('course_enrollments')
      .update({ payment_id: payment.id, updated_at: new Date().toISOString() })
      .eq('id', enrollment.id)

    if (applicantPhone) {
      await supabaseAdmin
        .from('users')
        .update({ phone: applicantPhone, updated_at: new Date().toISOString() })
        .eq('id', sessionUser.id)
    }

    void sendPaymentSubmittedToAdmin({
      payerName: applicantName || applicantEmail,
      payerEmail: applicantEmail,
      amount: amountDueFinal,
      context: `Course: ${course.title}`,
      receiptNumber: receiptNumber || null,
    })

    return NextResponse.json(
      {
        success: true,
        enrollmentId: enrollment.id,
        courseTitle: course.title,
        amountDue: amountDueFinal,
        message:
          'Enrollment submitted! We will verify your MoMo receipt within one business day. Track progress on your student dashboard.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit enrollment' }, { status: 500 })
  }
}
