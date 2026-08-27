'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'

export function StorefrontCartPage() {
  const t = useShopT()
  const shop = getDefaultStorefrontShop()
  const subtotal = 0
  const total = 0

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t('storefront.cart.title')}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {t('storefront.shoppingFrom')}: <span className="font-semibold text-slate-900">{shop.name}</span>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
          <p className="mt-4 text-sm font-medium text-slate-700">{t('storefront.cart.empty')}</p>
          <Button
            asChild
            className="mt-6 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          >
            <Link href="/">{t('storefront.cart.continue')}</Link>
          </Button>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>{t('common.subtotal')}</span>
            <span className="font-medium">{subtotal.toLocaleString()} RWF</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
            <span>{t('common.total')}</span>
            <span>{total.toLocaleString()} RWF</span>
          </div>
          <Button
            type="button"
            disabled
            className="mt-6 w-full bg-[var(--brand-navy,#1e3a5f)] text-white"
          >
            {t('storefront.checkout.title')}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {t('storefront.cart.checkoutSoon')}
          </p>
        </aside>
      </div>
    </section>
  )
}
