'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { previewUnitPrice } from '@/lib/shop/pos-pricing'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

type ProductRow = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category: { id: string; name: string } | null
  price: number
  discount: number
  costPrice: number
  stock: number
  status: string | null
  lowStockThreshold: number | null
}

type ProductDetail = ProductRow & {
  images: unknown
  createdAt: string | null
  updatedAt: string | null
}

export function ShopProductsPanel({ canSeeCost }: { canSeeCost: boolean }) {
  const t = useShopT()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('published')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ProductRow[]>([])
  const [total, setTotal] = useState(0)
  const [limit] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [, startTransition] = useTransition()

  const loadList = useEffectEvent(async (q: string, st: string, pg: number) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({
      page: String(pg),
      limit: String(limit),
      status: st || 'all',
    })
    if (q.trim()) params.set('q', q.trim())

    const result = await fetchStaffApi<StaffListResponse<ProductRow>>(
      `/api/staff/products?${params.toString()}`
    )
    if (!result.ok) {
      setItems([])
      setTotal(0)
      setError(result.error)
      setLoading(false)
      return
    }
    setItems(result.data.items ?? [])
    setTotal(result.data.total ?? 0)
    setLoading(false)
  })

  const loadDetail = useEffectEvent(async (id: string) => {
    setDetailError('')
    setDetail(null)
    const result = await fetchStaffApi<{ item: ProductDetail }>(`/api/staff/products/${id}`)
    if (!result.ok) {
      setDetailError(result.error)
      return
    }
    setDetail(result.data.item)
  })

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(() => {
        void loadList(query, status, page)
      })
    }, 220)
    return () => window.clearTimeout(handle)
  }, [query, status, page])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId)
  }, [selectedId])

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{t('products.readOnlyNote')}</p>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="shop-products-q" className="sr-only">
            {t('products.searchLabel')}
          </Label>
          <Input
            id="shop-products-q"
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder={t('products.searchPlaceholder')}
            className="bg-white"
          />
        </div>
        <div>
          <Label htmlFor="shop-products-status" className="sr-only">
            {t('products.statusLabel')}
          </Label>
          <select
            id="shop-products-status"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            <option value="published">{t('common.published')}</option>
            <option value="draft">{t('common.draft')}</option>
            <option value="all">{t('products.status.all')}</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('products.col.product')}</th>
                  <th className="px-3 py-2 font-medium">{t('products.col.price')}</th>
                  <th className="px-3 py-2 font-medium">{t('products.col.stock')}</th>
                  <th className="px-3 py-2 font-medium">{t('products.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const unit = previewUnitPrice(row.price, row.discount)
                  const active = selectedId === row.id
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-slate-100 cursor-pointer ${
                        active ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-900 line-clamp-1">{row.name}</p>
                        <p className="text-xs text-slate-500">
                          {row.sku || t('products.noSku')}
                          {row.category?.name ? ` · ${row.category.name}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-900">
                        {formatShopRwf(unit)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-700">
                        {formatShopInteger(row.stock)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {row.status ?? t('common.emDash')}
                      </td>
                    </tr>
                  )
                })}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      {t('products.empty')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-3 py-2">
            <ShopListPagination
              page={page}
              limit={limit}
              total={total}
              disabled={loading}
              onPageChange={setPage}
            />
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[240px]">
          {!selectedId ? (
            <p className="text-sm text-slate-600">{t('products.selectHint')}</p>
          ) : detailError ? (
            <p className="text-sm text-red-700">{detailError}</p>
          ) : !detail ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{detail.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{detail.status}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  {t('action.close')}
                </Button>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.sku')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.sku || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.barcode')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.barcode || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.category')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.category?.name || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.listPrice')}</dt>
                  <dd className="tabular-nums font-medium">{formatShopRwf(detail.price)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.discount')}</dt>
                  <dd className="tabular-nums font-medium">{formatShopRwf(detail.discount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.sellPrice')}</dt>
                  <dd className="tabular-nums font-semibold text-[var(--brand-navy,#1e3a5f)]">
                    {formatShopRwf(previewUnitPrice(detail.price, detail.discount))}
                  </dd>
                </div>
                {canSeeCost ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">{t('products.field.cost')}</dt>
                    <dd className="tabular-nums font-medium">{formatShopRwf(detail.costPrice)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.stock')}</dt>
                  <dd className="tabular-nums font-medium">{formatShopInteger(detail.stock)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
      {loading ? <p className="text-xs text-slate-400">{t('products.refreshing')}</p> : null}
    </div>
  )
}
