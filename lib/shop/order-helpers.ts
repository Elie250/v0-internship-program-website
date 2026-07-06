import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type OrderLineInput = { productId: string; quantity: number }

export type BuiltOrderLine = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  unit_cost: number
  line_total: number
}

export type BuiltOrder = {
  lineItems: BuiltOrderLine[]
  totalAmount: number
  totalCost: number
  productMap: Map<string, { id: string; name: string; price: number; discount: number; stock: number; cost_price?: number }>
}

export async function buildOrderLines(items: OrderLineInput[]): Promise<{ order?: BuiltOrder; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!items.length) return { error: 'Cart is empty' }

  const productIds = items.map((item) => item.productId)
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, discount, stock, status, cost_price')
    .in('id', productIds)
    .eq('status', 'published')

  if (productsError) return { error: productsError.message }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]))
  let totalAmount = 0
  let totalCost = 0
  const lineItems: BuiltOrderLine[] = []

  for (const item of items) {
    const product = productMap.get(item.productId)
    const quantity = Number(item.quantity)

    if (!product || !Number.isFinite(quantity) || quantity < 1) {
      return { error: 'Invalid cart item' }
    }
    if ((product.stock ?? 0) < quantity) {
      return { error: `Insufficient stock for ${product.name}. Available: ${product.stock ?? 0}` }
    }

    const unitPrice = Number(product.price) - Number(product.discount ?? 0)
    const unitCost = Number(product.cost_price ?? 0)
    const lineTotal = unitPrice * quantity
    totalAmount += lineTotal
    totalCost += unitCost * quantity
    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      unit_cost: unitCost,
      line_total: lineTotal,
    })
  }

  return { order: { lineItems, totalAmount, totalCost, productMap } }
}

export async function decrementStockForLines(
  lineItems: BuiltOrderLine[],
  productMap: BuiltOrder['productMap']
): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  for (const line of lineItems) {
    const product = productMap.get(line.product_id)
    if (!product) continue
    const nextStock = Math.max(0, Number(product.stock ?? 0) - line.quantity)
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        stock: nextStock,
        in_stock: nextStock > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', line.product_id)

    if (error) return { error: error.message }
  }

  return {}
}

export function generateOrderNumber(prefix = 'EL') {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${stamp}-${rand}`
}
