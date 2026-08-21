/**
 * Channel-agnostic receipt representation.
 * HTML / thermal / PDF printers should consume this model — not invent checkout UI formats.
 */
export type ReceiptLine = {
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  sku?: string | null
}

export type ReceiptModel = {
  schemaVersion: 1
  orderNumber: string
  channel: 'pos' | 'online' | string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  fulfillmentType?: string | null
  deliveryAddress?: string | null
  notes?: string | null
  totalAmount: number
  currency: 'RWF'
  orderStatus?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  orderDate: string
  items: ReceiptLine[]
  /** Future: ESC/POS, Bluetooth printer payloads, cash-drawer pulse flags */
  printHints?: {
    openCashDrawer?: boolean
    copies?: number
  }
}

export function buildReceiptModel(input: {
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  fulfillmentType?: string | null
  deliveryAddress?: string | null
  notes?: string | null
  totalAmount: number
  orderStatus?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  orderDate: string | Date
  items: ReceiptLine[]
  channel: string
  openCashDrawer?: boolean
}): ReceiptModel {
  return {
    schemaVersion: 1,
    orderNumber: input.orderNumber,
    channel: input.channel,
    customerName: input.customerName,
    customerEmail: input.customerEmail ?? null,
    customerPhone: input.customerPhone ?? null,
    fulfillmentType: input.fulfillmentType ?? null,
    deliveryAddress: input.deliveryAddress ?? null,
    notes: input.notes ?? null,
    totalAmount: input.totalAmount,
    currency: 'RWF',
    orderStatus: input.orderStatus ?? null,
    paymentStatus: input.paymentStatus ?? null,
    paymentMethod: input.paymentMethod ?? null,
    orderDate: new Date(input.orderDate).toISOString(),
    items: input.items,
    printHints: {
      openCashDrawer: Boolean(input.openCashDrawer),
      copies: 1,
    },
  }
}
