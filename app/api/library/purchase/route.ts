import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { libraryItemRequiresPayment } from '@/lib/library/access'
import { normalizeLibraryItem } from '@/lib/library/items'
import { sendPaymentSubmittedToAdmin } from '@/lib/email/notifications'

type SessionUser = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string | null
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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json(
        { error: 'Please log in before purchasing library content.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const slug = String(body.slug ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()
    const payerPhone = String(body.payerPhone ?? sessionUser.phone ?? '').trim()

    if (!slug) {
      return NextResponse.json({ error: 'Library item is required' }, { status: 400 })
    }

    const { data: row, error: itemError } = await supabaseAdmin
      .from('energy_library_items')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (itemError || !row) {
      return NextResponse.json({ error: 'Library item not found' }, { status: 404 })
    }

    const item = normalizeLibraryItem(row as Record<string, unknown>)
    if (!libraryItemRequiresPayment(item)) {
      return NextResponse.json({ error: 'This item is free to access' }, { status: 400 })
    }

    if (!receiptUrl) {
      return NextResponse.json(
        { error: 'Upload your MoMo payment receipt before submitting' },
        { status: 400 }
      )
    }

    const amountDue = Number(item.price_rwf ?? 0)
    const payerName =
      [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim() ||
      sessionUser.email

    const { data: existing } = await supabaseAdmin
      .from('library_purchases')
      .select('id, status')
      .eq('library_item_id', item.id)
      .eq('user_id', sessionUser.id)
      .maybeSingle()

    if (existing?.status === 'active') {
      return NextResponse.json({ error: 'You already have access to this item.' }, { status: 409 })
    }

    if (existing?.status === 'pending_payment') {
      return NextResponse.json(
        {
          error: 'You already submitted payment for this item. We will verify your receipt soon.',
          code: 'PENDING_PURCHASE',
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    let purchaseId = existing?.id as string | undefined

    if (!purchaseId) {
      const { data: purchase, error: purchaseError } = await supabaseAdmin
        .from('library_purchases')
        .insert([
          {
            library_item_id: item.id,
            user_id: sessionUser.id,
            status: 'pending_payment',
            amount_due: amountDue,
            updated_at: now,
          },
        ])
        .select('id')
        .single()

      if (purchaseError || !purchase) {
        return NextResponse.json(
          { error: purchaseError?.message || 'Failed to start purchase' },
          { status: 500 }
        )
      }
      purchaseId = purchase.id
    } else {
      await supabaseAdmin
        .from('library_purchases')
        .update({ status: 'pending_payment', amount_due: amountDue, updated_at: now })
        .eq('id', purchaseId)
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: amountDue,
          payer_name: payerName,
          payer_email: sessionUser.email.trim(),
          payer_phone: payerPhone || null,
          payment_method: 'MTN MoMo',
          receipt_url: receiptUrl,
          receipt_number: receiptNumber || null,
          library_purchase_id: purchaseId,
          status: 'pending_review',
        },
      ])
      .select('id')
      .single()

    if (paymentError || !payment) {
      if (!existing) {
        await supabaseAdmin.from('library_purchases').delete().eq('id', purchaseId)
      }
      return NextResponse.json(
        { error: paymentError?.message || 'Failed to submit payment receipt' },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('library_purchases')
      .update({ payment_id: payment.id, updated_at: now })
      .eq('id', purchaseId)

    if (payerPhone) {
      await supabaseAdmin
        .from('users')
        .update({ phone: payerPhone, updated_at: now })
        .eq('id', sessionUser.id)
    }

    void sendPaymentSubmittedToAdmin({
      payerName,
      payerEmail: sessionUser.email,
      amount: amountDue,
      context: `Library: ${item.title}`,
      receiptNumber: receiptNumber || null,
    })

    return NextResponse.json(
      {
        success: true,
        message:
          'Payment submitted! We will verify your MoMo receipt within one business day. Full content unlocks after approval.',
        itemTitle: item.title,
        amountDue,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit library purchase' }, { status: 500 })
  }
}
