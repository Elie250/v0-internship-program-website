import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { getStaffOrderById } from '@/lib/shop/staff-api/orders'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.orders)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const result = await getStaffOrderById(id)
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
}
