'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useShopI18n, useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { formatShopLongDate, formatShopRwf } from '@/lib/shop/format'
import type { PublicOrderStatus, PublicOrderView, PublicPaymentStatus } from '@/lib/shop/public-order-view'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

const ORDER_STATUS_KEYS: Record<PublicOrderStatus, ShopMessageKey> = {
  received: 'storefront.status.received',
  payment_awaiting: 'storefront.status.paymentAwaiting',
  payment_confirmed: 'storefront.status.paymentConfirmed',
  preparing: 'storefront.status.preparing',
  ready: 'storefront.status.ready',
  completed: 'storefront.status.completed',
  cancelled: 'storefront.status.cancelled',
}

const PAYMENT_STATUS_KEYS: Record<PublicPaymentStatus, ShopMessageKey> = {
  awaiting: 'storefront.payment.awaiting',
  confirmed: 'storefront.payment.confirmed',
  not_completed: 'storefront.payment.notCompleted',
}

export function StorefrontOrderCard({
  order,
  placed = false,
  showTitle = true,
}: {
  order: PublicOrderView
  placed?: boolean
  showTitle?: boolean
}) {
  const t = useShopT()
  const { locale } = useShopI18n()

  return (
    <div className="space-y-6">
      {placed ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            {t('storefront.checkout.successTitle')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {t('storefront.checkout.successTitle')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            {t('storefront.checkout.thankYou')}
          </p>
        </div>
      ) : showTitle ? (
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('storefront.order.title')}
          </h1>
        </div>
      ) : null}

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('common.order')}
          </p>
          <p className="mt-2 break-all font-mono text-xl font-bold tracking-wide text-[var(--brand-navy,#1e3a5f)] sm:text-2xl">
            {order.orderNumber}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-900">{order.shopName}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {placed ? t('storefront.checkout.keepNumber') : t('storefront.track.keepNumber')}
          </p>
        </div>

        <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('storefront.order.date')}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {formatShopLongDate(order.orderDate, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('storefront.order.status')}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {t(ORDER_STATUS_KEYS[order.status])}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('common.payment')}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {order.paymentMethod === 'cash' ? t('common.cash') : t('storefront.payment.momo')}
              {' · '}
              {t(PAYMENT_STATUS_KEYS[order.paymentStatus])}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('storefront.checkout.fulfillment')}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {order.fulfillmentType === 'delivery'
                ? t('storefront.checkout.delivery')
                : `${t('storefront.checkout.pickup')} — ${order.shopName}`}
            </dd>
          </div>
        </dl>

        {order.deliveryAddress ? (
          <p className="border-t border-slate-100 px-6 py-4 text-sm text-slate-700">
            <span className="font-semibold">{t('storefront.checkout.deliveryAddress')}: </span>
            {order.deliveryAddress}
          </p>
        ) : null}

        <div className="border-t border-slate-100 px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-900">{t('storefront.order.items')}</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <li
                key={`${item.productName}-${index}`}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.sellingUnitLabel
                      ? t('storefront.line.unitQty', {
                          unit: item.sellingUnitLabel,
                          n: item.quantity,
                        })
                      : t('storefront.line.qtyOnly', { n: item.quantity })}
                    {' · '}
                    {formatShopRwf(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900">
                  {formatShopRwf(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-base font-semibold text-slate-900">{t('common.total')}</span>
            <span className="text-base font-semibold text-slate-900">
              {formatShopRwf(order.totalAmount)}
            </span>
          </div>
        </div>
      </article>

      <div className="flex flex-col gap-3 sm:flex-row">
        {placed ? (
          <Button
            asChild
            className="flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          >
            <Link href="/track">{t('storefront.nav.track')}</Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="flex-1 border-slate-300"
          >
            <Link href="/track">{t('storefront.nav.track')}</Link>
          </Button>
        )}
        <Button
          asChild
          variant={placed ? 'outline' : 'default'}
          className={
            placed
              ? 'flex-1 border-slate-300'
              : 'flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90'
          }
        >
          <Link href="/">{t('storefront.cart.continue')}</Link>
        </Button>
      </div>
    </div>
  )
}

export function StorefrontOrderMissing({ attempted }: { attempted?: string }) {
  const t = useShopT()

  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t('storefront.order.notFoundTitle')}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('storefront.track.notFound')}</p>
      {attempted ? (
        <p className="mt-2 font-mono text-sm text-slate-800">{attempted}</p>
      ) : null}
      <Button
        asChild
        className="mt-8 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
      >
        <Link href="/track">{t('storefront.order.backToTrack')}</Link>
      </Button>
    </section>
  )
}
