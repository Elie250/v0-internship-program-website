/**
 * Client-side POS cart draft helpers.
 * Not a commerce order — confirmation still goes through createCommerceSale().
 * Prices/stock here are display hints only.
 */

export type PosCatalogProduct = {
  id: string
  name: string
  sku: string | null
  price: number
  discount: number
  stock: number
  sellingQuantity: number
  sellingUnit: string
}

export type PosCartLine = {
  productId: string
  name: string
  sku: string | null
  price: number
  discount: number
  quantity: number
  maxStock: number
  sellingQuantity: number
  sellingUnit: string
}

export type PosSaleItemPayload = {
  productId: string
  quantity: number
}

export function isPosCartEmpty(cart: PosCartLine[]): boolean {
  return !cart.some((line) => line.quantity > 0)
}

export function addProductToCart(
  cart: PosCartLine[],
  product: PosCatalogProduct
): PosCartLine[] {
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0))
  if (stock < 1) return cart

  const existing = cart.find((line) => line.productId === product.id)
  if (existing) {
    if (existing.quantity >= stock) return cart
    return cart.map((line) =>
      line.productId === product.id
        ? {
            ...line,
            name: product.name,
            sku: product.sku,
            price: product.price,
            discount: product.discount,
            maxStock: stock,
            quantity: line.quantity + 1,
            sellingQuantity: product.sellingQuantity,
            sellingUnit: product.sellingUnit,
          }
        : line
    )
  }

  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      discount: product.discount,
      quantity: 1,
      maxStock: stock,
      sellingQuantity: product.sellingQuantity,
      sellingUnit: product.sellingUnit,
    },
  ]
}

export function setCartLineQuantity(
  cart: PosCartLine[],
  productId: string,
  nextQty: number
): PosCartLine[] {
  const qty = Math.floor(Number(nextQty))
  if (!Number.isFinite(qty) || qty < 1) {
    return cart.filter((line) => line.productId !== productId)
  }
  return cart
    .map((line) => {
      if (line.productId !== productId) return line
      return { ...line, quantity: Math.min(line.maxStock, qty) }
    })
    .filter((line) => line.quantity > 0)
}

export function removeCartLine(cart: PosCartLine[], productId: string): PosCartLine[] {
  return cart.filter((line) => line.productId !== productId)
}

/** Payload for POST /api/staff/pos/sales — IDs and quantities only. */
export function cartToSaleItems(cart: PosCartLine[]): PosSaleItemPayload[] {
  return cart
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }))
}
