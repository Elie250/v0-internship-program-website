import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/actions/admin-context'
import { reviewPaymentCore } from '@/lib/admin/review-payment-core'

export async function POST(request: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = String(body.id ?? '').trim()
    const decision = body.decision === 'rejected' ? 'rejected' : 'approved'
    const adminNotes = body.adminNotes != null ? String(body.adminNotes) : undefined

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payment id is required' }, { status: 400 })
    }

    const result = await reviewPaymentCore(session, { id, decision, adminNotes })
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review payment'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
