import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
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
    await requireAdminPermission(PERMISSIONS.SHOP_PRODUCTS)
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

      const payload: Record<string, unknown> = {
        stock,
        in_stock: stock > 0,
        updated_at: new Date().toISOString(),
      }
      if (entry.low_stock_threshold != null) {
        payload.low_stock_threshold = Number(entry.low_stock_threshold)
      }

      const { error } = await supabaseAdmin.from('products').update(payload).eq('id', entry.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update stock'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
