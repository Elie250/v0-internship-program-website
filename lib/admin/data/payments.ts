import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isPendingPaymentStatus } from '@/lib/payments/status'

export type PaymentRecord = {
  id: string
  amount: number
  status: string
  payment_method: string | null
  receipt_number: string | null
  receipt_url: string | null
  payer_name: string | null
  payer_email: string | null
  payer_phone: string | null
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  application_id: string | null
  student_id: string | null
  course_enrollment_id: string | null
  support_subscription_id: string | null
  order_id: string | null
  course_id: string | null
  created_at: string
}

const PAYMENT_COLUMNS =
  'id, amount, status, payment_method, receipt_number, receipt_url, payer_name, payer_email, payer_phone, admin_notes, reviewed_by, reviewed_at, application_id, student_id, course_enrollment_id, support_subscription_id, order_id, course_id, created_at'

export function isEnrollmentPayment(payment: PaymentRecord): boolean {
  return Boolean(payment.course_enrollment_id)
}

export function isProductOrderPayment(payment: PaymentRecord): boolean {
  return Boolean(payment.order_id) || (!payment.course_enrollment_id && !payment.support_subscription_id)
}

/** @deprecated Use isProductOrderPayment */
export function isShopOrLegacyPayment(payment: PaymentRecord): boolean {
  return isProductOrderPayment(payment)
}

const PAYMENT_COLUMNS_BASE =
  'id, amount, status, payment_method, receipt_number, receipt_url, payer_name, payer_email, payer_phone, admin_notes, reviewed_by, reviewed_at, application_id, student_id, course_enrollment_id, support_subscription_id, course_id, created_at'

type PaymentQueryResult = {
  data: Array<Record<string, unknown>> | null
  error: { message: string } | null
}

async function queryPaymentRows(
  build: (columns: string) => PromiseLike<PaymentQueryResult>
): Promise<{ rows: PaymentRecord[]; error?: string }> {
  if (!supabaseAdmin) return { rows: [], error: 'Database not configured' }

  const primary = await build(PAYMENT_COLUMNS)
  let data: Array<Record<string, unknown>> | null = primary.data
  let error = primary.error

  if (error?.message?.includes('order_id')) {
    const retry = await build(PAYMENT_COLUMNS_BASE)
    data = (retry.data ?? []).map((row) => ({ ...row, order_id: null }))
    error = retry.error
  }

  if (error) return { rows: [], error: error.message }
  return { rows: (data ?? []) as unknown as PaymentRecord[] }
}

export async function queryPendingPayments(): Promise<{
  payments: PaymentRecord[]
  error?: string
}> {
  const { rows, error } = await queryPaymentRows(
    (columns) =>
      supabaseAdmin!
        .from('payments')
        .select(columns)
        .in('status', ['pending_review', 'Pending', 'pending'])
        .order('created_at', { ascending: false }) as unknown as PromiseLike<PaymentQueryResult>
  )

  if (error) return { payments: [], error }

  const pending = rows
    .filter((row) => isPendingPaymentStatus(String(row.status)))
    .filter((row) => isProductOrderPayment(row))

  return { payments: pending }
}

export async function queryAllPayments(limit = 100): Promise<{
  payments: PaymentRecord[]
  error?: string
}> {
  const { rows, error } = await queryPaymentRows(
    (columns) =>
      supabaseAdmin!
        .from('payments')
        .select(columns)
        .order('created_at', { ascending: false })
        .limit(limit) as unknown as PromiseLike<PaymentQueryResult>
  )

  if (error) return { payments: [], error }
  return { payments: rows.filter(isProductOrderPayment) }
}
