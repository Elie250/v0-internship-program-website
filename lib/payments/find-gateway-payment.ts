import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function findPaymentByIremboReference(input: {
  transactionId?: string
  invoiceNumber?: string
}): Promise<{ id: string; status: string } | null> {
  if (!supabaseAdmin) return null

  const queries = []
  if (input.transactionId) {
    queries.push(
      supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('gateway_reference', input.transactionId)
        .maybeSingle()
    )
  }
  if (input.invoiceNumber) {
    queries.push(
      supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('gateway_transaction_id', input.invoiceNumber)
        .maybeSingle()
    )
    queries.push(
      supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('receipt_number', input.invoiceNumber)
        .maybeSingle()
    )
  }

  for (const query of queries) {
    const { data } = await query
    if (data?.id) return { id: String(data.id), status: String(data.status) }
  }

  return null
}
