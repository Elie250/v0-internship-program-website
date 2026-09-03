/** One customer submit attempt reuses one key so a phone retry cannot create two orders. */
export function checkoutAttemptFingerprint(input: {
  slugs: Array<{ slug: string; quantity: number }>
  customerName: string
  customerEmail: string
  customerPhone: string
  fulfillmentType: 'pickup' | 'delivery'
  deliveryAddress: string
}): string {
  return JSON.stringify({
    items: input.slugs.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone.trim(),
    fulfillmentType: input.fulfillmentType,
    deliveryAddress: input.fulfillmentType === 'delivery' ? input.deliveryAddress.trim() : '',
  })
}

export function newOnlineIdempotencyKey(): string {
  return `online-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
