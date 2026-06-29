import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAllPayments, queryPendingPayments } from '@/lib/admin/data/payments'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { repairEnrollmentsWithApprovedPayments } from '@/lib/enrollment/repair-approved-payments'
import {
  isApprovedPaymentStatus,
  PAYMENT_REFUNDED_STATUSES,
  PAYMENT_REJECTED_STATUSES,
} from '@/lib/payments/status'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_VIEW)
    await repairEnrollmentsWithApprovedPayments()

    const [pendingRes, allRes] = await Promise.all([
      queryPendingPayments(),
      queryAllPayments(),
    ])

    if (pendingRes.error) {
      return NextResponse.json({ error: pendingRes.error }, { status: 500 })
    }

    const history = (allRes.payments ?? []).filter(
      (p) =>
        isApprovedPaymentStatus(p.status) ||
        PAYMENT_REJECTED_STATUSES.includes(p.status as (typeof PAYMENT_REJECTED_STATUSES)[number]) ||
        PAYMENT_REFUNDED_STATUSES.includes(p.status as (typeof PAYMENT_REFUNDED_STATUSES)[number])
    )

    return NextResponse.json({
      pending: pendingRes.payments ?? [],
      history: history.slice(0, 20),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payments'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
