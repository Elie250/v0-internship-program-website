'use client'

import { useCallback, useEffect, useEffectEvent, useId, useState, useTransition } from 'react'
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { previewCartTotals, previewUnitPrice } from '@/lib/shop/pos-pricing'
import {
  addProductToCart,
  cartToSaleItems,
  isPosCartEmpty,
  removeCartLine,
  setCartLineQuantity,
  type PosCartLine,
  type PosCatalogProduct,
} from '@/lib/shop/pos-cart'
import { useShopI18n, useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { shopPaymentStatusLabel, shopStockStateLabel } from '@/lib/shop/i18n/translate'
import type { ReceiptModel } from '@/lib/shop/receipt-model'

type SaleSuccess = {
  orderNumber: string
  totalAmount: number
  paymentStatus: string
  stockState: string
  receipt: ReceiptModel | null
  replay?: boolean
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export function ShopPosTerminal() {
  const t = useShopT()
  const { locale } = useShopI18n()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<PosCatalogProduct[]>([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState<PosCartLine[]>([])
  const [customerName, setCustomerName] = useState(() => t('pos.defaultCustomer'))
  const [customerPhone, setCustomerPhone] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SaleSuccess | null>(null)
  const [, startTransition] = useTransition()

  const runProductSearch = useEffectEvent(async (q: string) => {
    setSearching(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({
        status: 'published',
        limit: '24',
        page: '1',
      })
      const trimmed = q.trim()
      if (trimmed) params.set('q', trimmed)

      const res = await fetch(`/api/staff/products?${params.toString()}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setProducts([])
        setSearchError(
          typeof data.error === 'string' ? data.error : t('pos.error.loadProducts')
        )
        return
      }
      const items = Array.isArray(data.items) ? data.items : []
      setProducts(
        items.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          name: String(row.name ?? ''),
          sku: row.sku != null ? String(row.sku) : null,
          price: Number(row.price ?? 0),
          discount: Number(row.discount ?? 0),
          stock: Number(row.stock ?? 0),
        }))
      )
    } catch {
      setProducts([])
      setSearchError(t('pos.error.loadProducts'))
    } finally {
      setSearching(false)
    }
  })

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(() => {
        void runProductSearch(query)
      })
    }, 220)
    return () => window.clearTimeout(handle)
  }, [query])

  const totals = previewCartTotals(cart)
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartEmpty = isPosCartEmpty(cart)

  const addToCart = useCallback((product: PosCatalogProduct) => {
    if (product.stock <= 0) return
    setSuccess(null)
    setError('')
    setConfirmOpen(false)
    setIdempotencyKey(null)
    setCart((prev) => addProductToCart(prev, product))
  }, [])

  const updateQty = useCallback((productId: string, nextQty: number) => {
    setSuccess(null)
    setError('')
    setIdempotencyKey(null)
    setCart((prev) => setCartLineQuantity(prev, productId, nextQty))
  }, [])

  const removeLine = useCallback((productId: string) => {
    setSuccess(null)
    setError('')
    setIdempotencyKey(null)
    setCart((prev) => removeCartLine(prev, productId))
  }, [])

  function openConfirm() {
    if (cartEmpty || submitting) return
    setError('')
    setConfirmOpen(true)
    setIdempotencyKey((key) => key || newIdempotencyKey())
  }

  async function completeCashSale() {
    if (cartEmpty || submitting) return
    const items = cartToSaleItems(cart)
    if (!items.length) return
    const key = idempotencyKey || newIdempotencyKey()
    setIdempotencyKey(key)
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/staff/pos/sales', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({
          items,
          customerName: customerName.trim() || t('pos.defaultCustomer'),
          customerPhone: customerPhone.trim() || null,
          paymentMethod: 'cash',
          idempotencyKey: key,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' && data.error ? data.error : t('pos.saleFailed')
        )
      }
      setSuccess({
        orderNumber: String(data.orderNumber ?? ''),
        totalAmount: Number(data.totalAmount ?? 0),
        paymentStatus: String(data.paymentStatus ?? ''),
        stockState: String(data.stockState ?? ''),
        receipt: data.receipt ?? null,
        replay: Boolean(data.replay),
      })
      setCart([])
      setConfirmOpen(false)
      setMobileCartOpen(false)
      setIdempotencyKey(null)
      void runProductSearch(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.saleFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function startNewSale() {
    setSuccess(null)
    setError('')
    setConfirmOpen(false)
    setMobileCartOpen(false)
    setIdempotencyKey(null)
    setCart([])
    setCustomerName(t('pos.defaultCustomer'))
    setCustomerPhone('')
  }

  const salePanel = (
    <PosSalePanel
      cart={cart}
      totals={totals}
      customerName={customerName}
      customerPhone={customerPhone}
      confirmOpen={confirmOpen}
      submitting={submitting}
      error={error}
      cartEmpty={cartEmpty}
      onCustomerName={setCustomerName}
      onCustomerPhone={setCustomerPhone}
      onUpdateQty={updateQty}
      onRemove={removeLine}
      onReview={openConfirm}
      onBack={() => setConfirmOpen(false)}
      onConfirm={() => void completeCashSale()}
    />
  )

  if (success) {
    const receipt = success.receipt
    return (
      <div className="space-y-6 max-w-xl">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-950">{t('pos.successTitle')}</p>
          <p className="mt-1 text-sm text-emerald-900/90">{t('pos.successBody')}</p>
          {success.replay ? (
            <p className="mt-1 text-xs text-emerald-800">{t('pos.idempotentReplay')}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t('common.receipt')}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--brand-navy,#1e3a5f)]">
                {success.orderNumber || t('common.emDash')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{t('pos.previewTotal')}</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {formatShopRwf(success.totalAmount)}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t('pos.shop')}</dt>
              <dd className="font-medium text-slate-900">{t('brand.siteLabel')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.payment')}</dt>
              <dd className="font-medium text-slate-900">
                {t('pos.cashDotStatus', {
                  paymentStatus: shopPaymentStatusLabel(locale, success.paymentStatus),
                })}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.stock')}</dt>
              <dd className="font-medium text-slate-900">
                {shopStockStateLabel(locale, success.stockState)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.customer')}</dt>
              <dd className="font-medium text-slate-900">
                {receipt?.customerName || t('pos.defaultCustomer')}
              </dd>
            </div>
          </dl>

          {receipt?.items?.length ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {receipt.items.map((line, index) => (
                <li
                  key={`${line.productName}-${index}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{line.productName}</p>
                    <p className="text-xs text-slate-500">
                      {formatShopInteger(line.quantity)} × {formatShopRwf(line.unitPrice)}
                    </p>
                  </div>
                  <p className="tabular-nums font-medium text-slate-900">
                    {formatShopRwf(line.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="text-sm text-slate-700 pt-2 border-t border-slate-100">{t('pos.thankYou')}</p>
        </div>

        <Button
          type="button"
          className="bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          onClick={startNewSale}
        >
          {t('pos.newSale')}
        </Button>
      </div>
    )
  }

  return (
    <div className="relative pb-24 lg:pb-0">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div>
            <Label htmlFor={searchId} className="sr-only">
              {t('pos.searchLabel')}
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={searchId}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('pos.searchPlaceholder')}
                className="pl-9 bg-white"
                autoComplete="off"
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {searching ? t('pos.searching') : t('pos.catalogHint')}
            </p>
            {searchError ? <p className="mt-1 text-sm text-red-700">{searchError}</p> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 max-h-[560px] overflow-y-auto pr-1">
            {products.map((product) => {
              const unit = previewUnitPrice(product.price, product.discount)
              const disabled = product.stock <= 0
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => addToCart(product)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[var(--brand-navy,#1e3a5f)]/40 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    {product.sku || t('pos.noSku')}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold tabular-nums text-[var(--brand-navy,#1e3a5f)]">
                        {formatShopRwf(unit)}
                      </p>
                      {product.discount > 0 ? (
                        <p className="text-xs text-slate-400 line-through tabular-nums">
                          {formatShopRwf(product.price)}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('pos.stockLabel', { n: formatShopInteger(product.stock) })}
                    </p>
                  </div>
                </button>
              )
            })}
            {!searching && products.length === 0 ? (
              <p className="sm:col-span-2 text-sm text-slate-600 py-8 text-center">
                {t('pos.emptyProducts')}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="hidden lg:block lg:col-span-2">
          <div className="lg:sticky lg:top-4">{salePanel}</div>
        </aside>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3">
        <Button
          type="button"
          className="w-full h-12 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          onClick={() => setMobileCartOpen(true)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {t('pos.openCart')}
          <span className="ml-auto tabular-nums">
            {itemCount
              ? `${t(itemCount === 1 ? 'pos.itemCount' : 'pos.itemCountPlural', { n: formatShopInteger(itemCount) })} · ${formatShopRwf(totals.payableTotal)}`
              : formatShopRwf(0)}
          </span>
        </Button>
      </div>

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden max-h-[90vh] overflow-y-auto sm:max-w-none p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t('pos.cartTitle')}</SheetTitle>
            <SheetDescription>{t('pos.cartHint')}</SheetDescription>
          </SheetHeader>
          <div className="p-4">{salePanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PosSalePanel({
  cart,
  totals,
  customerName,
  customerPhone,
  confirmOpen,
  submitting,
  error,
  cartEmpty,
  onCustomerName,
  onCustomerPhone,
  onUpdateQty,
  onRemove,
  onReview,
  onBack,
  onConfirm,
}: {
  cart: PosCartLine[]
  totals: { listSubtotal: number; discountTotal: number; payableTotal: number }
  customerName: string
  customerPhone: string
  confirmOpen: boolean
  submitting: boolean
  error: string
  cartEmpty: boolean
  onCustomerName: (value: string) => void
  onCustomerPhone: (value: string) => void
  onUpdateQty: (productId: string, qty: number) => void
  onRemove: (productId: string) => void
  onReview: () => void
  onBack: () => void
  onConfirm: () => void
}) {
  const t = useShopT()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {confirmOpen ? t('pos.reviewTitle') : t('pos.cartTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {confirmOpen ? t('pos.confirmHint') : t('pos.cartHint')}
        </p>
      </div>

      {cartEmpty ? (
        <p className="text-sm text-slate-600">{t('pos.cartEmpty')}</p>
      ) : (
        <ul className="space-y-3 max-h-64 overflow-y-auto">
          {cart.map((line) => {
            const unit = previewUnitPrice(line.price, line.discount)
            const lineTotal = unit * line.quantity
            return (
              <li key={line.productId} className="border-b border-slate-100 pb-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{line.name}</p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {formatShopInteger(line.quantity)} × {formatShopRwf(unit)}
                      {line.discount > 0
                        ? ` ${t('pos.offList', { discount: formatShopRwf(line.discount) })}`
                        : ''}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums text-slate-900">
                    {formatShopRwf(lineTotal)}
                  </p>
                </div>
                {!confirmOpen ? (
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onUpdateQty(line.productId, line.quantity - 1)}
                      aria-label={t('a11y.decreaseQty')}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onUpdateQty(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.maxStock}
                      aria-label={t('a11y.increaseQty')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => onRemove(line.productId)}
                      aria-label={t('pos.remove')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{t('pos.listSubtotal')}</span>
          <span className="tabular-nums">{formatShopRwf(totals.listSubtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>{t('pos.discounts')}</span>
          <span className="tabular-nums">−{formatShopRwf(totals.discountTotal)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
          <span>{t('pos.previewTotal')}</span>
          <span className="tabular-nums">{formatShopRwf(totals.payableTotal)}</span>
        </div>
      </div>

      {confirmOpen ? (
        <dl className="grid gap-2 text-sm rounded-lg border border-slate-200 px-3 py-3">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t('pos.shop')}</dt>
            <dd className="font-medium text-slate-900">{t('brand.siteLabel')}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t('common.payment')}</dt>
            <dd className="font-medium text-slate-900">{t('common.cash')}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t('common.customer')}</dt>
            <dd className="font-medium text-slate-900 text-right">
              {customerName.trim() || t('pos.defaultCustomer')}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="space-y-2">
          <div>
            <Label htmlFor="pos-customer-name">{t('pos.customerName')}</Label>
            <Input
              id="pos-customer-name"
              className="mt-1"
              value={customerName}
              onChange={(e) => onCustomerName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pos-customer-phone">{t('pos.phoneOptional')}</Label>
            <Input
              id="pos-customer-phone"
              className="mt-1"
              value={customerPhone}
              onChange={(e) => onCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
        <p className="font-medium text-slate-900">{t('pos.paymentCash')}</p>
        <p className="text-xs text-slate-500 mt-0.5">{t('pos.paymentNote')}</p>
      </div>

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      {!confirmOpen ? (
        <Button
          type="button"
          className="w-full h-11 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
          disabled={cartEmpty || submitting}
          onClick={onReview}
        >
          {t('pos.reviewSale')}
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-950">
            {t('pos.confirmPrompt', { total: formatShopRwf(totals.payableTotal) })}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={submitting}
              onClick={onBack}
            >
              {t('action.back')}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[var(--brand-navy,#1e3a5f)] text-white"
              disabled={submitting || cartEmpty}
              onClick={onConfirm}
            >
              {submitting ? t('pos.processing') : t('pos.confirmSale')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
