import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isApprovedPaymentStatus } from '@/lib/payments/status'

type PendingEnrollmentRow = {
  id?: string
  course_id?: string
  payment_id?: string | null
}

/** Enrollments in payment_pending_review that still need admin action (payment not yet approved). */
export async function filterActionablePendingEnrollments<T extends PendingEnrollmentRow>(
  rows: T[]
): Promise<T[]> {
  if (!rows.length) return []

  const paymentIds = rows.map((r) => r.payment_id).filter(Boolean) as string[]
  if (!paymentIds.length || !supabaseAdmin) return rows

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .in('id', paymentIds)

  const approvedIds = new Set(
    (payments ?? [])
      .filter((p) => isApprovedPaymentStatus(String(p.status)))
      .map((p) => String(p.id))
  )

  return rows.filter((row) => !row.payment_id || !approvedIds.has(String(row.payment_id)))
}

export async function countActionablePendingEnrollments(): Promise<number> {
  if (!supabaseAdmin) return 0

  const { data: rows, error } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, payment_id')
    .eq('status', 'payment_pending_review')

  if (error || !rows?.length) return 0
  const actionable = await filterActionablePendingEnrollments(rows)
  return actionable.length
}
