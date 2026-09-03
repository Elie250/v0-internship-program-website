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

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    if (status === 'all') {
      await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
    }

    const publicSelect =
      'id, name, description, category_id, sku, price, discount, stock, low_stock_threshold, selling_quantity, selling_unit, is_featured, images, image_url, specifications, status, category:categories(id, name, slug, type)'
    const adminSelect = '*, category:categories(*)'
    // Dynamic select strings are not in the generated schema parser.
    const select = (status === 'all' ? adminSelect : publicSelect) as '*'
    let query = supabaseAdmin.from('products').select(select)
    if (status === 'all') {
      // no status filter
    } else if (status) {
      query = query.eq('status', status)
    } else {
      query = query.eq('status', 'published')
    }
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    type ProductListItem = Record<string, unknown> & {
      category?: { type?: string | null } | null
    }
    let products = (data ?? []) as ProductListItem[]
    if (type) {
      products = products.filter((p) => p.category?.type === type)
    }
    if (status !== 'all') {
      products = products.map((row) => {
        const { cost_price: _cost, ...safe } = row
        return safe as ProductListItem
      })
    }

    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const overlay = applySellingUnitToProductPayload(body, 'create')
    if (!overlay.ok) {
      return NextResponse.json({ error: overlay.error }, { status: 400 })
    }
    const featured = applyStorefrontFeaturedToProductPayload(overlay.payload, 'create')
    if (!featured.ok) {
      return NextResponse.json({ error: featured.error }, { status: 400 })
    }
    const barcode = applyBarcodeToProductPayload(featured.payload, 'create')
    if (!barcode.ok) {
      return NextResponse.json({ error: barcode.error }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([barcode.payload])
      .select()
      .single()
    if (error) {
      if (isDuplicateBarcodeError(error.message)) {
        return NextResponse.json({ error: DUPLICATE_BARCODE_MESSAGE }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
