import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { admitEnrollmentById } from '@/lib/enrollment/admit'
import { isPendingPaymentStatus } from '@/lib/payments/status'

/** Auto-fulfill enrollment/subscription after a verified gateway payment (no admin session). */
export async function fulfillApprovedPayment(paymentId: string): Promise<{
  success: boolean
  error?: string
  alreadyProcessed?: boolean
}> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Database not configured' }
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, status, course_enrollment_id, support_subscription_id, application_id, order_id')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError || !existing) {
    return { success: false, error: fetchError?.message ?? 'Payment not found' }
  }

  if (!isPendingPaymentStatus(String(existing.status)) && String(existing.status) === 'approved') {
    return { success: true, alreadyProcessed: true }
  }

  if (!isPendingPaymentStatus(String(existing.status))) {
    return { success: false, error: `Payment is already ${existing.status}` }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'approved',
      reviewed_at: now,
      payment_date: now,
      paid_at: now,
      updated_at: now,
      admin_notes: 'Auto-approved via IremboPay',
    })
    .eq('id', paymentId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  if (existing.application_id) {
    await supabaseAdmin
      .from('applications')
      .update({ status: 'payment_verified', updated_at: now })
      .eq('id', existing.application_id)
  }

  if (existing.course_enrollment_id) {
    const admitted = await admitEnrollmentById(existing.course_enrollment_id as string)
    if (!admitted.success) {
      return { success: false, error: admitted.error ?? 'Enrollment activation failed' }
    }

    const { data: enrolled } = await supabaseAdmin
      .from('course_enrollments')
      .select('applicant_name, applicant_email, amount_due, access_starts_at, course_id')
      .eq('id', existing.course_enrollment_id)
      .maybeSingle()

    let programTitle = 'your programme'
    if (enrolled?.course_id) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('title')
        .eq('id', enrolled.course_id)
        .maybeSingle()
      if (course?.title) programTitle = course.title
    }

    if (enrolled?.applicant_email) {
      const { sendEnrollmentApprovedEmail } = await import('@/lib/email/enrollment-notifications')
      void sendEnrollmentApprovedEmail({
        to: enrolled.applicant_email,
        studentName: enrolled.applicant_name,
        programTitle,
        amountPaid: Number(enrolled.amount_due ?? 0),
        accessStartsAt: enrolled.access_starts_at,
      })
    }
  }

  if (existing.support_subscription_id) {
    const { activateSupportSubscription } = await import('@/lib/support/activate-subscription')
    const activated = await activateSupportSubscription(existing.support_subscription_id as string)
    if (!activated.success) {
      return { success: false, error: activated.error ?? 'Subscription activation failed' }
    }

    const { data: sub } = await supabaseAdmin
      .from('support_subscriptions')
      .select('plan_id, user:users(first_name, last_name, email)')
      .eq('id', existing.support_subscription_id)
      .maybeSingle()

    let planName = 'Engineering support'
    if (sub?.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from('support_subscription_plans')
        .select('name')
        .eq('id', sub.plan_id)
        .maybeSingle()
      if (plan?.name) planName = plan.name
    }

    const subUser = sub?.user as { first_name?: string; last_name?: string; email?: string } | null
    const subEmail = subUser?.email ?? ''
    const subName =
      [subUser?.first_name, subUser?.last_name].filter(Boolean).join(' ').trim() || 'Engineer'

    if (subEmail) {
      const { sendSubscriptionApprovedEmail } = await import('@/lib/email/enrollment-notifications')
      void sendSubscriptionApprovedEmail({ to: subEmail, name: subName, planName })
    }
  }

  if (existing.order_id) {
    const { decrementStockForLines } = await import('@/lib/shop/order-helpers')

    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: now,
        updated_at: now,
      })
      .eq('id', existing.order_id)

    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, product_name, quantity, unit_price, unit_cost, line_total')
      .eq('order_id', existing.order_id)

    const { data: productRows } = await supabaseAdmin
      .from('products')
      .select('id, name, price, discount, stock, cost_price')
      .in('id', (orderItems ?? []).map((i) => i.product_id))

    const productMap = new Map((productRows ?? []).map((p) => [p.id, p]))
    const lines = (orderItems ?? []).map((item) => ({
      product_id: String(item.product_id),
      product_name: String(item.product_name ?? ''),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      unit_cost: Number(item.unit_cost ?? 0),
      line_total: Number(item.line_total),
    }))

    await decrementStockForLines(lines, productMap)
  }

  const { notifyPaymentReviewed } = await import('@/lib/email/payment-hooks')
  void notifyPaymentReviewed({
    paymentId,
    decision: 'approved',
    adminNotes: 'IremboPay auto-approval',
  })

  return { success: true }
}
