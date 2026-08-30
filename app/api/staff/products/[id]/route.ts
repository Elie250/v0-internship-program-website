import { NextResponse } from 'next/server'
import { requireStaffPermission, requireStaffSession } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { canViewStaffProductCost } from '@/lib/shop/staff-api/cost-policy'
import { getStaffProductById, updateStaffProduct } from '@/lib/shop/staff-api/products'
import { parseSellingUnitPatch, type SellingUnit } from '@/lib/shop/selling-unit'
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

    const auth = await requireStaffSession(request)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const hasSellingUnit =
      body.sellingQuantity !== undefined ||
      body.selling_quantity !== undefined ||
      body.sellingUnit !== undefined ||
      body.selling_unit !== undefined
    let sellingQuantity: number | undefined
    let sellingUnit: SellingUnit | undefined
    if (hasSellingUnit) {
      const parsed = parseSellingUnitPatch(body)
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 })
      }
      sellingQuantity = parsed.sellingQuantity
      sellingUnit = parsed.sellingUnit
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

    const permissions = auth.ctx.user.permissions
    const result = await updateStaffProduct(
      id,
      {
        name: body.name !== undefined ? String(body.name) : undefined,
        sku: body.sku !== undefined ? String(body.sku) : undefined,
        barcode: body.barcode !== undefined ? String(body.barcode) : undefined,
        categoryId:
          body.categoryId !== undefined
            ? String(body.categoryId)
            : body.category_id !== undefined
              ? String(body.category_id)
              : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
        lowStockThreshold:
          body.lowStockThreshold !== undefined
            ? Number(body.lowStockThreshold)
            : body.low_stock_threshold !== undefined
              ? Number(body.low_stock_threshold)
              : undefined,
        targetStock:
          body.targetStock !== undefined
            ? Number(body.targetStock)
            : body.target_stock !== undefined
              ? Number(body.target_stock)
              : undefined,
        sellingQuantity,
        sellingUnit,
        isFeatured,
        price: body.price !== undefined ? Number(body.price) : undefined,
        costPrice:
          body.costPrice !== undefined
            ? Number(body.costPrice)
            : body.cost_price !== undefined
              ? Number(body.cost_price)
              : undefined,
      },
      {
        includeCost: canViewStaffProductCost(permissions),
        actorUserId: auth.ctx.user.id,
        canManageProduct: hasPermission(permissions, PERMISSIONS.SHOP_PRODUCTS),
        canSetCost: hasPermission(permissions, PERMISSIONS.SHOP_COST_PRICE),
        canSetSelling: hasPermission(permissions, PERMISSIONS.SHOP_SELLING_PRICE),
      }
    )
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
