'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { STOREFRONT_FORM, STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import { useShopCart } from '@/lib/shop/cart-context'
import { formatShopRwf } from '@/lib/shop/format'

export function StorefrontCartPage() {
  const t = useShopT()
  const { items, subtotal, updateQuantity, removeItem } = useShopCart()
  const empty = items.length === 0

  return (
    <section className={`${STOREFRONT_GUTTER} py-10 sm:py-14`}>
      <div className={STOREFRONT_FORM}>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t('storefront.cart.title')}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white">
          {empty ? (
            <div className="px-6 py-16 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
              <p className="mt-4 text-sm font-medium text-slate-700">{t('storefront.cart.empty')}</p>
              <Button
                asChild
                className="mt-6 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
              >
                <Link href="/">{t('storefront.cart.continue')}</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 p-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt="" fill className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.sellingUnitLabel
                        ? t('storefront.line.unitQty', {
                            unit: item.sellingUnitLabel,
                            n: item.quantity,
                          })
                        : t('storefront.line.qtyOnly', { n: item.quantity })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatShopRwf(item.price)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-slate-300"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-slate-300"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8 text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatShopRwf(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>{t('common.subtotal')}</span>
            <span className="font-medium">{formatShopRwf(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
            <span>{t('common.total')}</span>
            <span>{formatShopRwf(subtotal)}</span>
          </div>
          {empty ? (
            <Button
              type="button"
              disabled
              className="mt-6 w-full bg-[var(--brand-navy,#1e3a5f)] text-white"
            >
              {t('storefront.checkout.title')}
            </Button>
          ) : (
            <Button
              asChild
              className="mt-6 w-full bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            >
              <Link href="/checkout">{t('storefront.checkout.title')}</Link>
            </Button>
          )}
        </aside>
      </div>
      </div>
    </section>
  )
}
