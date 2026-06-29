import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAllPayments, queryPendingPayments } from '@/lib/admin/data/payments'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.PAYMENTS_VIEW)
    const [pendingRes, allRes] = await Promise.all([
      queryPendingPayments(),
      queryAllPayments(),
    ])

    if (pendingRes.error) {
      return NextResponse.json({ error: pendingRes.error }, { status: 500 })
    }

    const history = (allRes.payments ?? []).filter(
      (p) => p.status === 'approved' || p.status === 'rejected' || p.status === 'Paid'
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
