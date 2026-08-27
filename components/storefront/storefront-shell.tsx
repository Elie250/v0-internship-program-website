'use client'

import type { ReactNode } from 'react'
import { StorefrontHeader } from '@/components/storefront/storefront-header'
import { StorefrontFooter } from '@/components/storefront/storefront-footer'
import { StorefrontShopContext } from '@/components/storefront/storefront-shop-context'
import type { StorefrontShopOption } from '@/lib/shop/storefront-shops'

export function StorefrontShell({
  children,
  shops,
  currentShopCode,
}: {
  children: ReactNode
  shops: readonly StorefrontShopOption[]
  currentShopCode: string
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StorefrontHeader />
      <div className="border-b border-amber-200/80 bg-amber-50">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <StorefrontShopContext shops={shops} currentCode={currentShopCode} />
        </div>
      </div>
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  )
}
