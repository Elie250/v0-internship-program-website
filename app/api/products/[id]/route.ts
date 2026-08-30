import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { applySellingUnitToProductPayload } from '@/lib/shop/selling-unit'
import { applyStorefrontFeaturedToProductPayload } from '@/lib/shop/storefront-featured'
import {
  applyBarcodeToProductPayload,
  DUPLICATE_BARCODE_MESSAGE,
  isDuplicateBarcodeError,
} from '@/lib/shop/product-barcode'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const overlay = applySellingUnitToProductPayload(body, 'update')
    if (!overlay.ok) {
      return NextResponse.json({ error: overlay.error }, { status: 400 })
    }
    const featured = applyStorefrontFeaturedToProductPayload(overlay.payload, 'update')
    if (!featured.ok) {
      return NextResponse.json({ error: featured.error }, { status: 400 })
    }
    const barcode = applyBarcodeToProductPayload(featured.payload, 'update')
    if (!barcode.ok) {
      return NextResponse.json({ error: barcode.error }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...barcode.payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) {
      if (isDuplicateBarcodeError(error.message)) {
        return NextResponse.json({ error: DUPLICATE_BARCODE_MESSAGE }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params

    const { error: archiveError } = await supabaseAdmin
      .from('products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      archived: true,
      message: 'Product was archived so historical orders and stock movements stay intact.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
