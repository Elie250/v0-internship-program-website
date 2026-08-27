'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MomoPayCard } from '@/components/payment/momo-pay-card'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'
import { useShopCart } from '@/lib/shop/cart-context'
import { formatShopRwf } from '@/lib/shop/format'

type Step = 'details' | 'payment' | 'success'

export function StorefrontCheckout() {
  const t = useShopT()
  const shop = getDefaultStorefrontShop()
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useShopCart()
  const [step, setStep] = useState<Step>('details')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
    notes: '',
    receiptUrl: '',
    receiptNumber: '',
  })

  const canProceedDetails =
    items.length > 0 &&
    Boolean(form.customerName.trim()) &&
    Boolean(form.customerEmail.trim()) &&
    Boolean(form.customerPhone.trim()) &&
    (form.fulfillmentType !== 'delivery' || Boolean(form.deliveryAddress.trim()))

  const canSubmitPayment =
    canProceedDetails && (Boolean(form.receiptUrl.trim()) || Boolean(form.receiptNumber.trim()))

  const amountLabel = useMemo(
    () => `${t('common.total')}: ${formatShopRwf(subtotal)}`,
    [subtotal, t]
  )

  const handleReceiptUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/public/upload-receipt', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('error.requestFailed'))
      setForm((prev) => ({ ...prev, receiptUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.productId,
            quantity: item.quantity,
            quotedUnitPrice: item.price,
          })),
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          fulfillmentType: form.fulfillmentType,
          deliveryAddress: form.deliveryAddress,
          notes: form.notes,
          receiptUrl: form.receiptUrl,
          receiptNumber: form.receiptNumber,
          paymentMethod: 'momo',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'CART_CHANGED') {
          throw new Error(t('storefront.checkout.cartChanged'))
        }
        throw new Error(data.error || t('error.requestFailed'))
      }
      setOrderNumber(String(data.orderNumber ?? ''))
      setConfirmedTotal(Number(data.totalAmount) || subtotal)
      clearCart()
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          {t('storefront.checkout.successTitle')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {t('storefront.checkout.successTitle')}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          {t('storefront.checkout.thankYou')}
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('common.order')}
          </p>
          <p className="mt-3 break-all font-mono text-2xl font-bold tracking-wide text-[var(--brand-navy,#1e3a5f)] sm:text-3xl">
            {orderNumber}
          </p>
          {confirmedTotal != null ? (
            <p className="mt-3 text-sm font-medium text-slate-700">
              {t('common.total')}: {formatShopRwf(confirmedTotal)}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {t('storefront.checkout.keepNumber')}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          >
            <Link href={`/order/${encodeURIComponent(orderNumber)}?placed=1`}>
              {t('storefront.nav.track')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-slate-300">
            <Link href="/">{t('storefront.cart.continue')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {t('storefront.checkout.title')}
        </h1>
        <p className="mt-4 text-sm text-slate-600">{t('storefront.cart.empty')}</p>
        <Button
          asChild
          className="mt-6 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
        >
          <Link href="/">{t('storefront.cart.continue')}</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t('storefront.checkout.title')}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {t('storefront.shoppingFrom')}:{' '}
        <span className="font-semibold text-slate-900">{shop.name}</span>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {step === 'details' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('storefront.checkout.contact')}
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="customerName">{t('storefront.checkout.fullName')}</Label>
                  <Input
                    id="customerName"
                    required
                    className="mt-1"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">{t('auth.email')}</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    required
                    className="mt-1"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">{t('storefront.checkout.phone')}</Label>
                  <Input
                    id="customerPhone"
                    required
                    className="mt-1"
                    placeholder="+250..."
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('storefront.checkout.fulfillment')}</Label>
                  <Select
                    value={form.fulfillmentType}
                    onValueChange={(value) => setForm({ ...form, fulfillmentType: value })}
                  >
                    <SelectTrigger className="mt-1 border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">
                        {t('storefront.checkout.pickup')} — {shop.name}
                      </SelectItem>
                      <SelectItem value="delivery">{t('storefront.checkout.delivery')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.fulfillmentType === 'delivery' ? (
                  <div>
                    <Label htmlFor="deliveryAddress">{t('storefront.checkout.deliveryAddress')}</Label>
                    <Textarea
                      id="deliveryAddress"
                      required
                      className="mt-1"
                      value={form.deliveryAddress}
                      onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    />
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="notes">{t('storefront.checkout.notes')}</Label>
                  <Textarea
                    id="notes"
                    className="mt-1"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{t('common.payment')}</h2>
              <MomoPayCard amountLabel={amountLabel} />
              <div>
                <Label htmlFor="receipt">{t('storefront.checkout.receiptUpload')}</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  className="mt-1"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleReceiptUpload(file)
                  }}
                />
                {form.receiptUrl ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    {t('storefront.checkout.receiptReady')}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="receiptNumber">{t('storefront.checkout.receiptRef')}</Label>
                <Input
                  id="receiptNumber"
                  className="mt-1"
                  value={form.receiptNumber}
                  onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              <p>{error}</p>
              {error === t('storefront.checkout.cartChanged') ? (
                <Link href="/cart" className="mt-2 inline-block underline">
                  {t('storefront.cart.title')}
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {step === 'payment' ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-300"
                onClick={() => {
                  setError('')
                  setStep('details')
                }}
              >
                {t('action.back')}
              </Button>
            ) : (
              <Button asChild variant="outline" className="flex-1 border-slate-300">
                <Link href="/cart">{t('action.back')}</Link>
              </Button>
            )}
            {step === 'details' ? (
              <Button
                type="button"
                className="flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
                disabled={!canProceedDetails}
                onClick={() => {
                  setError('')
                  setStep('payment')
                }}
              >
                {t('storefront.checkout.continuePayment')}
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
                disabled={submitting || uploading || !canSubmitPayment}
                onClick={() => void handleSubmitOrder()}
              >
                {submitting ? t('storefront.checkout.submitting') : t('storefront.checkout.submit')}
              </Button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('storefront.checkout.summary')}
          </h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 py-4 first:pt-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {item.image ? (
                    <Image src={item.image} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <ShoppingBag className="m-auto h-6 w-6 text-slate-400" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {t('common.price')}: {formatShopRwf(item.price)}
                  </p>
                  {step === 'details' ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-slate-300"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-slate-300"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-7 w-7 text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">
                      {t('common.quantity')}: {item.quantity}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatShopRwf(item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-700">
            <span>{t('common.subtotal')}</span>
            <span className="font-medium">{formatShopRwf(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-base font-semibold text-slate-900">
            <span>{t('common.total')}</span>
            <span>{formatShopRwf(subtotal)}</span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {t('storefront.checkout.previewHint')}
          </p>
        </aside>
      </div>
    </section>
  )
}
