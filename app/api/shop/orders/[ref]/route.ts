import { NextResponse } from 'next/server'
import { getPublicOrder } from '@/lib/shop/public-order'

/** Public order lookup by order_number. Never returns order UUID or staff fields. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params
  const order = await getPublicOrder(ref)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  return NextResponse.json({ order })
}
