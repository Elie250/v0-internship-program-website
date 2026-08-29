'use client'

import type { ReactNode } from 'react'
import { StorefrontHeader } from '@/components/storefront/storefront-header'
import { StorefrontFooter } from '@/components/storefront/storefront-footer'
import type { StorefrontShopOption } from '@/lib/shop/storefront-shops'
import { cn } from '@/lib/utils'

export function StorefrontShell({
  children,
  shops,
  currentShopCode,
  className,
}: {
  children: ReactNode
  shops: readonly StorefrontShopOption[]
  currentShopCode: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'storefront-app flex min-h-screen w-full min-w-0 flex-col bg-[var(--shop-bg)] text-[var(--shop-text)]',
        className
      )}
    >
      <StorefrontHeader shops={shops} currentShopCode={currentShopCode} />
      <main className="w-full min-w-0 flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  )
}
