import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getAdminSession } from '@/app/actions/admin-context'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { adjustStockAbsolute } from '@/lib/shop/stock-ops'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (
      !session ||
      !hasPermission(session.user.permissions, [
        PERMISSIONS.SHOP_PRODUCTS,
        PERMISSIONS.SHOP_STOCK_VIEW,
      ])
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, stock, low_stock_threshold, status, price')
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load stock'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession()
    if (
      !session ||
      !hasPermission(session.user.permissions, [
        PERMISSIONS.SHOP_PRODUCTS,
        PERMISSIONS.SHOP_STOCK_ADJUST,
      ])
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const updates: { id: string; stock: number; low_stock_threshold?: number }[] = body.updates ?? []

    if (!updates.length) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    for (const entry of updates) {
      const stock = Number(entry.stock)
      if (!entry.id || !Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ error: 'Invalid stock update' }, { status: 400 })
      }

      const result = await adjustStockAbsolute({
        productId: entry.id,
        newStock: stock,
        actorUserId: session.user.id,
        reason: 'Admin stock adjustment',
      })
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      if (entry.low_stock_threshold != null) {
        const { error } = await supabaseAdmin
          .from('products')
          .update({
            low_stock_threshold: Number(entry.low_stock_threshold),
            updated_at: new Date().toISOString(),
          })
          .eq('id', entry.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update stock'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
