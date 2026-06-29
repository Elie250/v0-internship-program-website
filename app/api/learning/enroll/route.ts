import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const courseId = String(body.courseId ?? '').trim()
    const applicantName = String(body.applicantName ?? '').trim()
    const applicantEmail = String(body.applicantEmail ?? '').trim()
    const applicantPhone = String(body.applicantPhone ?? '').trim()
    const motivation = String(body.motivation ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    if (!courseId || !applicantName || !applicantEmail || !applicantPhone) {
      return NextResponse.json(
        { error: 'Course, name, email, and phone are required' },
        { status: 400 }
      )
    }
    if (!receiptUrl) {
      return NextResponse.json(
        { error: 'Upload your MoMo payment receipt before submitting' },
        { status: 400 }
      )
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, pricing, status')
      .eq('id', courseId)
      .eq('status', 'published')
      .maybeSingle()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found or not open for enrollment' }, { status: 404 })
    }

    const amountDue = Number(course.pricing ?? 0)

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .insert([
        {
          course_id: course.id,
          applicant_name: applicantName,
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
      return NextResponse.json(
        { error: enrollmentError?.message || 'Failed to create enrollment' },
        { status: 500 }
      )
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: amountDue,
          payer_name: applicantName,
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

    return NextResponse.json(
      {
        success: true,
        enrollmentId: enrollment.id,
        courseTitle: course.title,
        amountDue,
        message:
          'Application submitted. Our team will verify your MoMo receipt and contact you to confirm admission.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit enrollment' }, { status: 500 })
  }
}
