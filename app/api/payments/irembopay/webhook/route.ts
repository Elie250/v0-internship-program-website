import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyIremboPayWebhookSignature } from '@/lib/payments/irembopay'
import { findPaymentByIremboReference } from '@/lib/payments/find-gateway-payment'
import { fulfillApprovedPayment } from '@/lib/payments/fulfill-approved-payment'

type NotificationPayload = {
  success?: boolean
  data?: {
    invoiceNumber?: string
    transactionId?: string
    paymentStatus?: string
    paymentReference?: string | null
    paymentMethod?: string | null
    currency?: string
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('irembopay-signature')

    if (!verifyIremboPayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody) as NotificationPayload
    const data = payload.data

    if (!data || data.paymentStatus !== 'PAID') {
      return NextResponse.json({ received: true })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const invoiceNumber = data.invoiceNumber ?? ''
    const transactionId = data.transactionId ?? ''

    const payment = await findPaymentByIremboReference({
      transactionId,
      invoiceNumber,
    })

    if (!payment?.id) {
      return NextResponse.json({ received: true, note: 'Payment row not found' })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        gateway_transaction_id: invoiceNumber || undefined,
        receipt_number: data.paymentReference ?? invoiceNumber ?? undefined,
        payment_method: data.paymentMethod
          ? `IremboPay (${data.paymentMethod})`
          : 'IremboPay',
        currency: data.currency ?? 'RWF',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    const fulfilled = await fulfillApprovedPayment(payment.id)
    if (!fulfilled.success && !fulfilled.alreadyProcessed) {
      return NextResponse.json({ error: fulfilled.error }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
