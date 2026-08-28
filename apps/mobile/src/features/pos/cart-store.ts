import { create } from 'zustand'
import type { StaffProduct } from '@/src/api/types'
import { previewCartTotals } from '@/src/features/pos/pricing'

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
  addProduct: (product: StaffProduct) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

export const usePosCart = create<CartState>((set) => ({
  lines: [],
  addProduct: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === product.id)
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
          ),
        }
      }
      return {
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
      lines:
        quantity < 1
          ? state.lines.filter((line) => line.productId !== productId)
          : state.lines.map((line) =>
              line.productId === productId ? { ...line, quantity: Math.floor(quantity) } : line
            ),
    })),
  remove: (productId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),
  clear: () => set({ lines: [] }),
}))

export function cartCheckoutItems(lines: CartLine[]) {
  return lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
}

export function cartPreview(lines: CartLine[]) {
  return previewCartTotals(lines)
}
