import { create } from 'zustand'
import type { StaffProduct } from '@/src/api/types'
import { previewCartTotals } from '@/src/features/pos/pricing'
import { checkoutFingerprint, newCheckoutIdempotencyKey } from '@/src/features/pos/idempotency'

export type CartLine = {
  productId: string
  name: string
  quantity: number
  sellingUnitLabel: string
  price: number
  discount: number
}

type CartState = {
  lines: CartLine[]
  checkoutKey: string | null
  checkoutFingerprint: string | null
  addProduct: (product: StaffProduct) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  getOrCreateCheckoutKey: (fingerprint: string) => string
}

function dropCheckoutAttempt() {
  return { checkoutKey: null as string | null, checkoutFingerprint: null as string | null }
}

export const usePosCart = create<CartState>((set, get) => ({
  lines: [],
  checkoutKey: null,
  checkoutFingerprint: null,
  addProduct: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === product.id)
      if (existing) {
        return {
          ...dropCheckoutAttempt(),
          lines: state.lines.map((line) =>
            line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
          ),
        }
      }
      return {
        ...dropCheckoutAttempt(),
        lines: [
          ...state.lines,
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            sellingUnitLabel: product.sellingUnitLabel,
            price: product.price,
            discount: product.discount,
          },
        ],
      }
    }),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      ...dropCheckoutAttempt(),
      lines:
        quantity < 1
          ? state.lines.filter((line) => line.productId !== productId)
          : state.lines.map((line) =>
              line.productId === productId ? { ...line, quantity: Math.floor(quantity) } : line
            ),
    })),
  remove: (productId) =>
    set((state) => ({
      ...dropCheckoutAttempt(),
      lines: state.lines.filter((line) => line.productId !== productId),
    })),
  clear: () => set({ lines: [], ...dropCheckoutAttempt() }),
  getOrCreateCheckoutKey: (fingerprint) => {
    const current = get()
    if (current.checkoutKey && current.checkoutFingerprint === fingerprint) {
      return current.checkoutKey
    }
    const key = newCheckoutIdempotencyKey()
    set({ checkoutKey: key, checkoutFingerprint: fingerprint })
    return key
  },
}))

export function cartCheckoutItems(lines: CartLine[]) {
  return lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
}

export function cartPreview(lines: CartLine[]) {
  return previewCartTotals(lines)
}

export { checkoutFingerprint }
