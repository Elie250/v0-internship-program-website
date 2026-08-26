import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { listStaffOrders } from '@/lib/shop/staff-api/orders'

export async function GET(request: Request) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.orders)
    if ('response' in auth) return auth.response

    const result = await listStaffOrders(new URL(request.url).searchParams)
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}
