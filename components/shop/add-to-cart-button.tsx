'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopCart } from '@/lib/shop/cart-context'

type Props = {
  productId: string
  name: string
  price: number
  stock: number
  image?: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AddToCartButton({ productId, name, price, stock, image, className, size = 'default' }: Props) {
  const { addItem } = useShopCart()

  if (stock <= 0) {
    return (
      <Button disabled className={className} size={size}>
        Out of stock
      </Button>
    )
  }

  return (
    <Button
      size={size}
      className={className ?? 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'}
      onClick={() =>
        addItem(
          {
            productId,
            name,
            price,
            image,
            maxStock: stock,
          },
          1
        )
      }
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      Add to cart
    </Button>
  )
}
