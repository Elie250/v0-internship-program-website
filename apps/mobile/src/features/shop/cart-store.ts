import { create } from 'zustand'
import type { PublicCatalogueItem } from '@/src/api/public-types'

/**
 * Customer cart — local display state only.
 * `quantity` is the number of selling units (e.g. 2 × 5 M), never converted.
 * Checkout is not submitted from this store.
 */
export type ShopCartLine = {
  slug: string
  name: string
  image: string | null
  displayPrice: number
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  quantity: number
}

type ShopCartState = {
  lines: ShopCartLine[]
  addProduct: (product: PublicCatalogueItem) => void
  setQuantity: (slug: string, quantity: number) => void
  remove: (slug: string) => void
  clear: () => void
}

export const useShopCart = create<ShopCartState>((set) => ({
  lines: [],
  addProduct: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.slug === product.slug)
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.slug === product.slug ? { ...line, quantity: line.quantity + 1 } : line
          ),
        }
      }
      return {
        lines: [
          ...state.lines,
          {
            slug: product.slug,
            name: product.name,
            image: product.image,
            displayPrice: product.price,
            sellingQuantity: product.sellingQuantity,
            sellingUnit: product.sellingUnit,
            sellingUnitLabel: product.sellingUnitLabel,
            quantity: 1,
          },
        ],
      }
    }),
  setQuantity: (slug, quantity) =>
    set((state) => ({
      lines:
        quantity < 1
          ? state.lines.filter((line) => line.slug !== slug)
          : state.lines.map((line) =>
              line.slug === slug ? { ...line, quantity: Math.floor(quantity) } : line
            ),
    })),
  remove: (slug) => set((state) => ({ lines: state.lines.filter((line) => line.slug !== slug) })),
  clear: () => set({ lines: [] }),
}))

export function shopCartItemCount(lines: ShopCartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function shopCartDisplayTotal(lines: ShopCartLine[]) {
  return lines.reduce((sum, line) => sum + line.displayPrice * line.quantity, 0)
}
