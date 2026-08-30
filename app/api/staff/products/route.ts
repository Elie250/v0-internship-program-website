import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { canViewStaffProductCost } from '@/lib/shop/staff-api/cost-policy'
import { createStaffProduct, listStaffProducts } from '@/lib/shop/staff-api/products'
import { isSellingUnit } from '@/lib/shop/selling-unit'

export async function GET(request: Request) {
  try {
    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.products)
    if ('response' in auth) return auth.response

    const includeCost = canViewStaffProductCost(auth.ctx.user.permissions)
    const result = await listStaffProducts(new URL(request.url).searchParams, {
      includeCost,
    })
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.productManage)
    if ('response' in auth) return auth.response

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const sellingUnit = body.sellingUnit ?? body.selling_unit
    const result = await createStaffProduct(
      {
        name: String(body.name ?? ''),
        description: body.description != null ? String(body.description) : null,
        sku: body.sku != null ? String(body.sku) : null,
        barcode: body.barcode != null ? String(body.barcode) : null,
        images: body.images,
        categoryId: body.categoryId != null ? String(body.categoryId) : body.category_id != null ? String(body.category_id) : null,
        price: body.price != null ? Number(body.price) : undefined,
        costPrice: body.costPrice != null ? Number(body.costPrice) : body.cost_price != null ? Number(body.cost_price) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        lowStockThreshold:
          body.lowStockThreshold != null
            ? Number(body.lowStockThreshold)
            : body.low_stock_threshold != null
              ? Number(body.low_stock_threshold)
              : undefined,
        targetStock:
          body.targetStock != null
            ? Number(body.targetStock)
            : body.target_stock != null
              ? Number(body.target_stock)
              : undefined,
        sellingQuantity:
          body.sellingQuantity != null
            ? Number(body.sellingQuantity)
            : body.selling_quantity != null
              ? Number(body.selling_quantity)
              : undefined,
        sellingUnit: typeof sellingUnit === 'string' && isSellingUnit(sellingUnit) ? sellingUnit : undefined,
        isFeatured: Boolean(body.isFeatured ?? body.is_featured),
      },
      {
        includeCost: canViewStaffProductCost(auth.ctx.user.permissions),
        actorUserId: auth.ctx.user.id,
        canSetCost: hasPermission(auth.ctx.user.permissions, PERMISSIONS.SHOP_COST_PRICE),
        canSetSelling: hasPermission(auth.ctx.user.permissions, PERMISSIONS.SHOP_SELLING_PRICE),
      }
    )
    if (!('body' in result)) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body, { status: result.httpStatus })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
