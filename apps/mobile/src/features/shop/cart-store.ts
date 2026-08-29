import { create } from 'zustand'
import type { PublicCatalogueItem } from '@/src/api/public-types'
import {
  applyAddProduct,
  applySetQuantity,
  applyStockLimits,
  parsePersistedCart,
  type ShopCartLine,
} from '@/src/features/shop/cart-rules'
import { readPersistedCartJson, writePersistedCartJson } from '@/src/features/shop/cart-persist'

export type { ShopCartLine }

type ShopCartState = {
  lines: ShopCartLine[]
  hydrated: boolean
  hydrate: () => Promise<void>
  addProduct: (product: PublicCatalogueItem, quantity?: number) => void
  setQuantity: (slug: string, quantity: number) => void
  remove: (slug: string) => void
  clear: () => void
  applyLiveStock: (products: PublicCatalogueItem[]) => void
}

function persist(lines: ShopCartLine[]) {
  void writePersistedCartJson(JSON.stringify(lines)).catch(() => undefined)
}

export const useShopCart = create<ShopCartState>((set, get) => ({
  lines: [],
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await readPersistedCartJson()
      const parsed = raw ? (JSON.parse(raw) as unknown) : []
      set({ lines: parsePersistedCart(parsed), hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
  addProduct: (product, quantity = 1) => {
    const lines = applyAddProduct(get().lines, product, quantity)
    set({ lines })
    persist(lines)
  },
  setQuantity: (slug, quantity) => {
    const lines = applySetQuantity(get().lines, slug, quantity)
    set({ lines })
    persist(lines)
  },
  remove: (slug) => {
    const lines = get().lines.filter((line) => line.slug !== slug)
    set({ lines })
    persist(lines)
  },
  clear: () => {
    set({ lines: [] })
    persist([])
  },
  applyLiveStock: (products) => {
    const lines = applyStockLimits(
      get().lines,
      products.map((product) => ({
        slug: product.slug,
        maxQuantity: product.maxQuantity,
        price: product.price,
      }))
    )
    set({ lines })
    persist(lines)
  },
}))

export function shopCartItemCount(lines: ShopCartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function shopCartDisplayTotal(lines: ShopCartLine[]) {
  return lines.reduce((sum, line) => sum + line.displayPrice * line.quantity, 0)
}
