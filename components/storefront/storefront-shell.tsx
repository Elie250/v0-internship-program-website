'use client'

import type { ReactNode } from 'react'
import { StorefrontHeader } from '@/components/storefront/storefront-header'
import { StorefrontFooter } from '@/components/storefront/storefront-footer'
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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-slate-50 text-slate-900">
      <StorefrontHeader shops={shops} currentShopCode={currentShopCode} />
      <main className="w-full min-w-0 flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  )
}
