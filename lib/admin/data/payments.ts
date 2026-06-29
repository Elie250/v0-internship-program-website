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
  course_id: string | null
  created_at: string
}

const PAYMENT_COLUMNS =
  'id, amount, status, payment_method, receipt_number, receipt_url, payer_name, payer_email, payer_phone, admin_notes, reviewed_by, reviewed_at, application_id, student_id, course_enrollment_id, support_subscription_id, course_id, created_at'

export async function queryPendingPayments(): Promise<{
  payments: PaymentRecord[]
  error?: string
}> {
  if (!supabaseAdmin) return { payments: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .in('status', ['pending_review', 'Pending', 'pending'])
    .order('created_at', { ascending: false })

  if (error) return { payments: [], error: error.message }

  const pending = (data ?? []).filter((row) => isPendingPaymentStatus(String(row.status)))

  return { payments: pending as PaymentRecord[] }
}

export async function queryAllPayments(limit = 100): Promise<{
  payments: PaymentRecord[]
  error?: string
}> {
  if (!supabaseAdmin) return { payments: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { payments: [], error: error.message }
  return { payments: (data ?? []) as PaymentRecord[] }
}
