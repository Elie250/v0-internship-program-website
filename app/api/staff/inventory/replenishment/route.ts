import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { listStaffReplenishment } from '@/lib/shop/staff-api/inventory'

export async function GET(request: Request) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.replenishment)
    if ('response' in auth) return auth.response

    const result = await listStaffReplenishment(new URL(request.url).searchParams)
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load replenishment' }, { status: 500 })
  }
}
