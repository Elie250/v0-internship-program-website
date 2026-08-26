import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { canViewStaffProductCost } from '@/lib/shop/staff-api/cost-policy'
import { getStaffProductById } from '@/lib/shop/staff-api/products'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.products)
    if ('response' in auth) return auth.response

    const includeCost = canViewStaffProductCost(auth.ctx.user.permissions)
    const { id } = await context.params
    const result = await getStaffProductById(id, { includeCost })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}
