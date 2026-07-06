import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { PENDING_ENROLLMENT_STATUSES } from '@/lib/enrollment/constants'
import { getEnrollEligibility } from '@/lib/enrollment/eligibility'
import { isFreeProgram } from '@/lib/enrollment/program-types'
import {
  createIremboPayInvoice,
  generateIremboTransactionId,
  isIremboPayEnabled,
} from '@/lib/payments/irembopay'

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
    if (!isIremboPayEnabled()) {
      return NextResponse.json(
        { error: 'Online payments are not enabled yet. Use MTN MoMo Pay Code and upload your receipt.' },
        { status: 503 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json({ error: 'Please log in before paying.' }, { status: 401 })
    }

    if (sessionUser.role !== 'student' && sessionUser.role !== 'registered') {
      return NextResponse.json({ error: 'Student account required.' }, { status: 403 })
    }

    const body = await request.json()
    const courseId = String(body.courseId ?? '').trim()
    const applicantPhone = String(body.applicantPhone ?? '').trim()
    const motivation = String(body.motivation ?? '').trim()

    if (!courseId || !applicantPhone) {
      return NextResponse.json({ error: 'Course and phone number are required' }, { status: 400 })
    }

    const applicantName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim()
    const applicantEmail = sessionUser.email.trim()

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
    if (isFreeProgram(amountDue)) {
      return NextResponse.json({ error: 'This programme is free — enroll without payment.' }, { status: 400 })
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
      return NextResponse.json({ error: eligibility.reason ?? 'Cannot enroll' }, { status: 409 })
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
      return NextResponse.json(
        { error: 'You already have an enrollment or pending payment for this course.' },
        { status: 409 }
      )
    }

    const txRef = generateIremboTransactionId(`enroll-${courseId.slice(0, 8)}`)

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
          amount_due: amountDue,
          status: 'payment_pending_review',
        },
      ])
      .select()
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: enrollmentError?.message || 'Failed to create enrollment' }, { status: 500 })
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: amountDue,
          payer_name: applicantName || applicantEmail,
          payer_email: applicantEmail,
          payer_phone: applicantPhone,
          payment_method: 'IremboPay (MTN MoMo / card)',
          course_enrollment_id: enrollment.id,
          course_id: course.id,
          status: 'gateway_pending',
          gateway_provider: 'irembopay',
          gateway_reference: txRef,
          currency: 'RWF',
        },
      ])
      .select()
      .single()

    if (paymentError || !payment) {
      await supabaseAdmin.from('course_enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json({ error: paymentError?.message || 'Failed to create payment' }, { status: 500 })
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

    const invoiceResult = await createIremboPayInvoice({
      transactionId: txRef,
      unitAmount: amountDue,
      description: `${course.title} — Engineering Hub enrollment`,
      customer: {
        email: applicantEmail,
        name: applicantName || applicantEmail,
        phoneNumber: applicantPhone,
      },
    })

    if (!invoiceResult.invoice) {
      await supabaseAdmin.from('payments').delete().eq('id', payment.id)
      await supabaseAdmin.from('course_enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json({ error: invoiceResult.error || 'Could not create payment invoice' }, { status: 502 })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        gateway_transaction_id: invoiceResult.invoice.invoiceNumber,
        receipt_number: invoiceResult.invoice.invoiceNumber,
        currency: invoiceResult.invoice.currency ?? 'RWF',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    const { getIremboPayConfig } = await import('@/lib/payments/irembopay-config')
    const config = getIremboPayConfig()

    return NextResponse.json({
      invoiceNumber: invoiceResult.invoice.invoiceNumber,
      paymentLinkUrl: invoiceResult.invoice.paymentLinkUrl,
      publicKey: config.publicKey,
      transactionId: txRef,
      amount: invoiceResult.invoice.amount,
      currency: invoiceResult.invoice.currency,
      amountLabel: `${Number(invoiceResult.invoice.amount).toLocaleString()} ${invoiceResult.invoice.currency}`,
      enrollmentId: enrollment.id,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 })
  }
}
