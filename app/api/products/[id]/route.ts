import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

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
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

    const { count, error: countError } = await supabaseAdmin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)

    if (countError && !countError.message.includes('does not exist')) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
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
        message:
          'Product has order history and was archived instead of deleted. It no longer appears in the shop.',
      })
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) {
      if (error.message.includes('violates foreign key') || error.code === '23503') {
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
          message:
            'Product is linked to past orders and was archived instead of deleted. It no longer appears in the shop.',
        })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, archived: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
