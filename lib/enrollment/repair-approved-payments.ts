import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { admitEnrollmentById } from '@/lib/enrollment/admit'
import { isApprovedPaymentStatus } from '@/lib/payments/status'

/** Fix enrollments left pending after payment was already approved (e.g. legacy reviewer UUID bug). */
export async function repairEnrollmentsWithApprovedPayments(): Promise<number> {
  if (!supabaseAdmin) return 0

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id, course_enrollment_id, status')
    .in('status', ['approved', 'Paid'])
    .not('course_enrollment_id', 'is', null)

  let repaired = 0

  for (const payment of payments ?? []) {
    if (!payment.course_enrollment_id || !isApprovedPaymentStatus(String(payment.status))) {
      continue
    }

    const { data: enrollment } = await supabaseAdmin
      .from('course_enrollments')
      .select('status')
      .eq('id', payment.course_enrollment_id)
      .maybeSingle()

    if (enrollment?.status === 'payment_pending_review') {
      const result = await admitEnrollmentById(payment.course_enrollment_id as string)
      if (result.success) repaired += 1
    }
  }

  return repaired
}
