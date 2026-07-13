import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type LibraryPurchaseRow = {
  purchaseId: string
  status: string
  amountDue: number
  createdAt: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  item: {
    id: string
    title: string
    slug: string
    pillar: string
  } | null
  payment: {
    id: string
    amount: number
    status: string
    receiptUrl: string | null
    receiptNumber: string | null
    adminNotes: string | null
    createdAt: string
  } | null
}

export async function queryLibraryPurchases(
  filter: 'pending' | 'history' | 'all' = 'pending'
): Promise<{ rows: LibraryPurchaseRow[]; error?: string }> {
  if (!supabaseAdmin) return { rows: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('library_purchases')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.eq('status', 'pending_payment')
  } else if (filter === 'history') {
    query = query.in('status', ['active', 'rejected', 'refunded'])
  }

  const { data: purchases, error } = await query.limit(200)
  if (error?.message?.includes('library_purchases')) {
    return { rows: [], error: 'Run scripts/61-library-payments.sql in Supabase.' }
  }
  if (error) return { rows: [], error: error.message }

  const itemIds = [...new Set((purchases ?? []).map((p) => p.library_item_id).filter(Boolean))]
  const userIds = [...new Set((purchases ?? []).map((p) => p.user_id).filter(Boolean))]
  const purchaseIds = (purchases ?? []).map((p) => p.id)

  let itemsById = new Map<string, LibraryPurchaseRow['item']>()
  if (itemIds.length) {
    const { data: items } = await supabaseAdmin
      .from('energy_library_items')
      .select('id, title, slug, pillar')
      .in('id', itemIds)
    itemsById = new Map(
      (items ?? []).map((item) => [
        item.id,
        {
          id: item.id,
          title: item.title,
          slug: item.slug,
          pillar: item.pillar,
        },
      ])
    )
  }

  let usersById = new Map<string, { name: string; email: string; phone: string | null }>()
  if (userIds.length) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .in('id', userIds)
    usersById = new Map(
      (users ?? []).map((user) => [
        user.id,
        {
          name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email,
          email: user.email,
          phone: user.phone ?? null,
        },
      ])
    )
  }

  let paymentsByPurchase = new Map<string, LibraryPurchaseRow['payment']>()
  if (purchaseIds.length) {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select(
        'id, amount, status, receipt_url, receipt_number, admin_notes, created_at, library_purchase_id'
      )
      .in('library_purchase_id', purchaseIds)
      .order('created_at', { ascending: false })

    for (const payment of payments ?? []) {
      if (!payment.library_purchase_id || paymentsByPurchase.has(payment.library_purchase_id)) {
        continue
      }
      paymentsByPurchase.set(payment.library_purchase_id, {
        id: payment.id,
        amount: Number(payment.amount ?? 0),
        status: payment.status,
        receiptUrl: payment.receipt_url,
        receiptNumber: payment.receipt_number,
        adminNotes: payment.admin_notes,
        createdAt: payment.created_at,
      })
    }
  }

  const rows: LibraryPurchaseRow[] = (purchases ?? []).map((purchase) => {
    const buyer = usersById.get(purchase.user_id)
    return {
      purchaseId: purchase.id,
      status: purchase.status,
      amountDue: Number(purchase.amount_due ?? 0),
      createdAt: purchase.created_at,
      buyerName: buyer?.name ?? 'Reader',
      buyerEmail: buyer?.email ?? '',
      buyerPhone: buyer?.phone ?? null,
      item: purchase.library_item_id ? itemsById.get(purchase.library_item_id) ?? null : null,
      payment: paymentsByPurchase.get(purchase.id) ?? null,
    }
  })

  return { rows }
}
