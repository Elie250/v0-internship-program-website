import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getIremboPayInvoice } from '@/lib/payments/irembopay'
import { findPaymentByIremboReference } from '@/lib/payments/find-gateway-payment'
import { fulfillApprovedPayment } from '@/lib/payments/fulfill-approved-payment'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceNumber = searchParams.get('invoice') ?? searchParams.get('invoiceNumber') ?? ''
    const transactionId =
      searchParams.get('transactionId') ??
      searchParams.get('transaction_id') ??
      searchParams.get('tx_ref') ??
      ''

    const reference = invoiceNumber || transactionId
    if (!reference) {
      return NextResponse.json({ error: 'Missing invoice or transaction reference' }, { status: 400 })
    }

    const invoiceResult = await getIremboPayInvoice(reference)
    if (!invoiceResult.invoice) {
      return NextResponse.json({ error: invoiceResult.error || 'Invoice not found' }, { status: 404 })
    }

    const invoice = invoiceResult.invoice
    if (invoice.paymentStatus !== 'PAID') {
      return NextResponse.json({
        success: false,
        error: 'Payment is not completed yet. If you paid, wait a moment and refresh.',
        status: invoice.paymentStatus,
      })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const payment = await findPaymentByIremboReference({
      transactionId: invoice.transactionId,
      invoiceNumber: invoice.invoiceNumber,
    })

    if (!payment?.id) {
      return NextResponse.json({
        success: true,
        message: 'Payment received. If access is not unlocked within a few minutes, contact support.',
      })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        gateway_transaction_id: invoice.invoiceNumber,
        receipt_number: invoice.paymentReference ?? invoice.invoiceNumber,
        payment_method: invoice.paymentMethod
          ? `IremboPay (${invoice.paymentMethod})`
          : 'IremboPay',
        currency: invoice.currency ?? 'RWF',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    const fulfilled = await fulfillApprovedPayment(payment.id)
    if (!fulfilled.success && !fulfilled.alreadyProcessed) {
      return NextResponse.json({ error: fulfilled.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message:
        'Payment confirmed! Your programme access is now active on your student dashboard.',
    })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
