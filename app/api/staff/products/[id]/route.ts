import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { canViewStaffProductCost } from '@/lib/shop/staff-api/cost-policy'
import { getStaffProductById, updateStaffProductSellingUnit } from '@/lib/shop/staff-api/products'
import { parseSellingUnitPatch } from '@/lib/shop/selling-unit'
import { parseStorefrontFeaturedFlag } from '@/lib/shop/storefront-featured'

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, PERMISSIONS.SHOP_PRODUCTS)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const parsed = parseSellingUnitPatch(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const featuredRaw = body.isFeatured ?? body.is_featured
    let isFeatured: boolean | undefined
    if (featuredRaw !== undefined) {
      const featured = parseStorefrontFeaturedFlag(featuredRaw)
      if (!featured.ok) {
        return NextResponse.json({ error: featured.error }, { status: 400 })
      }
      isFeatured = featured.value
    }

    const includeCost = canViewStaffProductCost(auth.ctx.user.permissions)
    const result = await updateStaffProductSellingUnit(
      id,
      {
        sellingQuantity: parsed.sellingQuantity,
        sellingUnit: parsed.sellingUnit,
        isFeatured,
      },
      { includeCost }
    )
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

