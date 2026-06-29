import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendEnrollmentAdmittedEmail,
  sendSupportSubscriptionActivatedEmail,
} from '@/lib/email/notifications'

type PaymentRow = {
  id: string
  amount: number
  payer_name: string | null
  payer_email: string | null
  course_enrollment_id: string | null
  support_subscription_id: string | null
  application_id: string | null
  course_id: string | null
}

async function resolvePaymentContext(payment: PaymentRow): Promise<string> {
  if (!supabaseAdmin) return 'Platform payment'

  if (payment.course_enrollment_id || payment.course_id) {
    const courseId = payment.course_id
    if (courseId) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle()
      if (course?.title) return `Course: ${course.title}`
    }
    if (payment.course_enrollment_id) {
      const { data: enrollment } = await supabaseAdmin
        .from('course_enrollments')
        .select('course:courses(title)')
        .eq('id', payment.course_enrollment_id)
        .maybeSingle()
      const title = (enrollment?.course as { title?: string } | null)?.title
      if (title) return `Course: ${title}`
    }
    return 'Course enrollment'
  }

  if (payment.support_subscription_id) {
    const { data: sub } = await supabaseAdmin
      .from('support_subscriptions')
      .select('plan:support_subscription_plans(name)')
      .eq('id', payment.support_subscription_id)
      .maybeSingle()
    const planName = (sub?.plan as { name?: string } | null)?.name
    if (planName) return `Support plan: ${planName}`
    return 'Engineering support subscription'
  }

  if (payment.application_id) {
    return 'Internship / programme application'
  }

  return 'Platform payment'
}

export async function notifyPaymentReviewed(input: {
  paymentId: string
  decision: 'approved' | 'rejected'
  adminNotes?: string
}): Promise<void> {
  if (!supabaseAdmin) return

  try {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select(
        'id, amount, payer_name, payer_email, course_enrollment_id, support_subscription_id, application_id, course_id'
      )
      .eq('id', input.paymentId)
      .maybeSingle()

    if (!payment?.payer_email) return

    const payerName = payment.payer_name?.trim() || payment.payer_email
    const amount = Number(payment.amount ?? 0)
    const context = await resolvePaymentContext(payment as PaymentRow)

    if (input.decision === 'approved') {
      const hasEnrollment = Boolean(payment.course_enrollment_id)
      const hasSubscription = Boolean(payment.support_subscription_id)

      if (!hasEnrollment && !hasSubscription) {
        await sendPaymentApprovedEmail({
          to: payment.payer_email,
          payerName,
          amount,
          context,
        })
      }

      if (payment.course_enrollment_id) {
        const { data: enrollment } = await supabaseAdmin
          .from('course_enrollments')
          .select('applicant_email, applicant_name, course:courses(title)')
          .eq('id', payment.course_enrollment_id)
          .maybeSingle()

        const courseTitle =
          (enrollment?.course as { title?: string } | null)?.title ?? 'your course'
        const email = enrollment?.applicant_email ?? payment.payer_email
        const name = enrollment?.applicant_name?.trim() || payerName

        await sendEnrollmentAdmittedEmail({
          to: email,
          studentName: name,
          courseTitle,
        })
      }

      if (payment.support_subscription_id) {
        const { data: sub } = await supabaseAdmin
          .from('support_subscriptions')
          .select('user_id, ends_at, plan:support_subscription_plans(name)')
          .eq('id', payment.support_subscription_id)
          .maybeSingle()

        const planName =
          (sub?.plan as { name?: string } | null)?.name ?? 'Engineering support'
        let userEmail = payment.payer_email
        let userName = payerName

        if (sub?.user_id) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email, first_name, last_name')
            .eq('id', sub.user_id)
            .maybeSingle()
          if (user?.email) userEmail = user.email
          const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
          if (full) userName = full
        }

        await sendSupportSubscriptionActivatedEmail({
          to: userEmail,
          userName,
          planName,
          endsAt: sub?.ends_at ?? null,
        })
      }
    } else {
      await sendPaymentRejectedEmail({
        to: payment.payer_email,
        payerName,
        amount,
        context,
        adminNotes: input.adminNotes,
      })
    }
  } catch (error) {
    console.error('[email] notifyPaymentReviewed failed:', error)
  }
}
