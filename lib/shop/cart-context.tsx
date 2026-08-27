'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  maxStock: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const STORAGE_KEY = 'engineering-hub-shop-cart'

const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(storageKey: string): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ShopCartProvider({
  children,
  storageKey = STORAGE_KEY,
}: {
  children: ReactNode
  storageKey?: string
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(readStoredCart(storageKey))
    setReady(true)
  }, [storageKey])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey, ready])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      if (item.maxStock < 1) return current
      const qty = Math.min(Math.max(1, Math.floor(quantity) || 1), item.maxStock)
      const existing = current.find((entry) => entry.productId === item.productId)
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, item.maxStock)
        return current.map((entry) =>
          entry.productId === item.productId
            ? { ...entry, quantity: nextQty, maxStock: item.maxStock, price: item.price }
            : entry
        )
      }
      return [...current, { ...item, quantity: qty }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.productId === productId
            ? { ...entry, quantity: Math.max(1, Math.min(quantity, entry.maxStock)) }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((entry) => entry.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useShopCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useShopCart must be used within ShopCartProvider')
  }
  return context
}

export const STOREFRONT_CART_STORAGE_KEY = 'energy-logics-storefront-cart'
