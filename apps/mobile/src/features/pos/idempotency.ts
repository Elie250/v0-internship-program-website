/**
 * One logical POS checkout attempt reuses one idempotency key.
 * Cart or payment-method changes start a new attempt.
 */
export function checkoutFingerprint(
  items: Array<{ productId: string; quantity: number }>,
  paymentMethod: 'cash' | 'momo'
): string {
  return JSON.stringify({
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    paymentMethod,
  })
}

export function newCheckoutIdempotencyKey(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `pos-${Date.now()}-${rand}`
}
