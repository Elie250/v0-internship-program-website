'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { previewUnitPrice } from '@/lib/shop/pos-pricing'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import {
  SELLING_UNITS,
  formatSellingUnit,
  isSellingUnit,
  parseSellingQuantity,
  parseSellingUnit,
} from '@/lib/shop/selling-unit'

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
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  isFeatured?: boolean
}

type ProductDetail = ProductRow & {
  description?: string | null
  categoryId?: string | null
  images: unknown
  createdAt: string | null
  updatedAt: string | null
}

type ShopCategory = { id: string; name: string; type?: string }

function firstImageUrl(images: unknown): string {
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0]
  return ''
}

export function ShopProductsPanel({
  canSeeCost,
  canManage = false,
  canEditSelling = false,
  canEditCost = false,
}: {
  canSeeCost: boolean
  canManage?: boolean
  canEditSelling?: boolean
  canEditCost?: boolean
}) {
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
  const [sellingQuantity, setSellingQuantity] = useState('1')
  const [sellingUnit, setSellingUnit] = useState('PCS')
  const [featured, setFeatured] = useState(false)
  const [sellingSaving, setSellingSaving] = useState(false)
  const [sellingMessage, setSellingMessage] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [priceDraft, setPriceDraft] = useState('')
  const [costDraft, setCostDraft] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPrice, setCreatePrice] = useState('')
  const [createCost, setCreateCost] = useState('')
  const [createSku, setCreateSku] = useState('')
  const [createBarcode, setCreateBarcode] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createImage, setCreateImage] = useState('')
  const [skuDraft, setSkuDraft] = useState('')
  const [barcodeDraft, setBarcodeDraft] = useState('')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [imageDraft, setImageDraft] = useState('')
  const [categories, setCategories] = useState<ShopCategory[]>([])
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
    setSellingQuantity(String(result.data.item.sellingQuantity ?? 1))
    setSellingUnit(
      isSellingUnit(String(result.data.item.sellingUnit ?? 'PCS'))
        ? String(result.data.item.sellingUnit)
        : 'PCS'
    )
    setFeatured(Boolean(result.data.item.isFeatured))
    setNameDraft(result.data.item.name)
    setPriceDraft(String(result.data.item.price ?? ''))
    setCostDraft(result.data.item.costPrice != null ? String(result.data.item.costPrice) : '')
    setSkuDraft(result.data.item.sku ?? '')
    setBarcodeDraft(result.data.item.barcode ?? '')
    setCategoryDraft(result.data.item.categoryId ?? result.data.item.category?.id ?? '')
    setDescriptionDraft(result.data.item.description ?? '')
    setImageDraft(firstImageUrl(result.data.item.images))
    setSellingMessage('')
  })

  useEffect(() => {
    void fetch('/api/categories?type=shop')
      .then((res) => res.json())
      .then((data: unknown) => {
        setCategories(Array.isArray(data) ? (data as ShopCategory[]) : [])
      })
      .catch(() => setCategories([]))
  }, [])

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
      <p className="text-xs text-slate-500">
        {canManage ? t('products.manageNote') : t('products.readOnlyNote')}
      </p>

      {canManage ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
            {createOpen ? t('action.close') : t('products.create')}
          </Button>
        </div>
      ) : null}
      {createOpen && canManage ? (
        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault()
            const result = await fetchStaffApi<{ item: ProductRow }>('/api/staff/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: createName,
                description: createDescription,
                sku: createSku,
                barcode: createBarcode,
                categoryId: createCategoryId || null,
                price: createPrice ? Number(createPrice) : undefined,
                costPrice: createCost ? Number(createCost) : undefined,
                images: createImage ? [createImage] : [],
              }),
            })
            if (!result.ok) {
              setError(result.error)
              return
            }
            setCreateOpen(false)
            setCreateName('')
            setCreatePrice('')
            setCreateCost('')
            setCreateSku('')
            setCreateBarcode('')
            setCreateCategoryId('')
            setCreateDescription('')
            setCreateImage('')
            void loadList(query, status, 1)
          }}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="create-product-name">{t('products.field.name')}</Label>
            <Input
              id="create-product-name"
              className="mt-1 bg-white"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="create-product-category">{t('products.field.category')}</Label>
            <select
              id="create-product-category"
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={createCategoryId}
              onChange={(e) => setCreateCategoryId(e.target.value)}
            >
              <option value="">{t('common.emDash')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="create-product-sku">{t('products.field.sku')}</Label>
            <Input
              id="create-product-sku"
              className="mt-1 bg-white"
              value={createSku}
              onChange={(e) => setCreateSku(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-product-barcode">{t('products.field.barcode')}</Label>
            <Input
              id="create-product-barcode"
              className="mt-1 bg-white"
              value={createBarcode}
              onChange={(e) => setCreateBarcode(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">{t('products.barcodeHint')}</p>
          </div>
          {canEditSelling ? (
            <div>
              <Label htmlFor="create-product-price">{t('products.field.listPrice')}</Label>
              <Input
                id="create-product-price"
                className="mt-1 bg-white"
                type="number"
                min="0"
                value={createPrice}
                onChange={(e) => setCreatePrice(e.target.value)}
              />
            </div>
          ) : null}
          {canEditCost ? (
            <div>
              <Label htmlFor="create-product-cost">{t('products.field.cost')}</Label>
              <Input
                id="create-product-cost"
                className="mt-1 bg-white"
                type="number"
                min="0"
                value={createCost}
                onChange={(e) => setCreateCost(e.target.value)}
              />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Label htmlFor="create-product-description">{t('products.field.description')}</Label>
            <Textarea
              id="create-product-description"
              className="mt-1 bg-white"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField
              label={t('products.field.image')}
              value={createImage}
              onChange={setCreateImage}
              folder="products"
              uploadPath="/api/staff/upload"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-slate-500">{t('products.stockCreateHint')}</p>
          <div>
            <Button type="submit">{t('products.create')}</Button>
          </div>
        </form>
      ) : null}

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
                          {row.sellingUnitLabel ||
                            formatSellingUnit(row.sellingQuantity, row.sellingUnit)}
                          {row.isFeatured ? ` · ${t('products.field.featured')}` : ''}
                          {row.sku ? ` · ${row.sku}` : ` · ${t('products.noSku')}`}
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
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.sellingUnit')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.sellingUnitLabel ||
                      formatSellingUnit(detail.sellingQuantity, detail.sellingUnit)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('products.field.featured')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.isFeatured ? t('products.featuredOn') : t('products.featuredOff')}
                  </dd>
                </div>
              </dl>
              {canManage || canEditSelling || canEditCost ? (
                <form
                  className="space-y-3 border-t border-slate-100 pt-3"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    setSellingMessage('')
                    const payload: Record<string, unknown> = {}
                    if (canManage) {
                      const qty = parseSellingQuantity(sellingQuantity)
                      const unit = parseSellingUnit(sellingUnit)
                      if (!qty.ok || !unit.ok) {
                        setSellingMessage(t('products.sellingInvalid'))
                        return
                      }
                      payload.sellingQuantity = qty.value
                      payload.sellingUnit = unit.value
                      payload.isFeatured = featured
                      payload.name = nameDraft
                      payload.sku = skuDraft
                      payload.barcode = barcodeDraft
                      payload.categoryId = categoryDraft || null
                      payload.description = descriptionDraft
                      payload.images = imageDraft ? [imageDraft] : []
                    }
                    if (canEditSelling && priceDraft !== '') payload.price = Number(priceDraft)
                    if (canEditCost && costDraft !== '') payload.costPrice = Number(costDraft)
                    setSellingSaving(true)
                    const result = await fetchStaffApi<{ item: ProductDetail }>(
                      `/api/staff/products/${detail.id}`,
                      {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      }
                    )
                    setSellingSaving(false)
                    if (!result.ok) {
                      setSellingMessage(result.error)
                      return
                    }
                    setDetail(result.data.item)
                    setSellingMessage(t('products.sellingSaved'))
                  }}
                >
                  {canManage ? (
                    <>
                      <div>
                        <Label htmlFor="shop-product-name">{t('products.field.name')}</Label>
                        <Input
                          id="shop-product-name"
                          className="mt-1 bg-white"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shop-product-category">{t('products.field.category')}</Label>
                        <select
                          id="shop-product-category"
                          className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          value={categoryDraft}
                          onChange={(e) => setCategoryDraft(e.target.value)}
                        >
                          <option value="">{t('common.emDash')}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="shop-product-sku">{t('products.field.sku')}</Label>
                        <Input
                          id="shop-product-sku"
                          className="mt-1 bg-white"
                          value={skuDraft}
                          onChange={(e) => setSkuDraft(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shop-product-barcode">{t('products.field.barcode')}</Label>
                        <Input
                          id="shop-product-barcode"
                          className="mt-1 bg-white"
                          value={barcodeDraft}
                          onChange={(e) => setBarcodeDraft(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-slate-500">{t('products.barcodeHint')}</p>
                      </div>
                      <div>
                        <Label htmlFor="shop-product-description">{t('products.field.description')}</Label>
                        <Textarea
                          id="shop-product-description"
                          className="mt-1 bg-white"
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <ImageUploadField
                        label={t('products.field.image')}
                        value={imageDraft}
                        onChange={setImageDraft}
                        folder="products"
                        uploadPath="/api/staff/upload"
                      />
                    </>
                  ) : null}
                  {canEditSelling ? (
                    <div>
                      <Label htmlFor="shop-product-price">{t('products.field.listPrice')}</Label>
                      <Input
                        id="shop-product-price"
                        className="mt-1 bg-white"
                        type="number"
                        min="0"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                      />
                    </div>
                  ) : null}
                  {canEditCost ? (
                    <div>
                      <Label htmlFor="shop-product-cost">{t('products.field.cost')}</Label>
                      <Input
                        id="shop-product-cost"
                        className="mt-1 bg-white"
                        type="number"
                        min="0"
                        value={costDraft}
                        onChange={(e) => setCostDraft(e.target.value)}
                      />
                    </div>
                  ) : null}
                  {canManage ? (
                    <>
                      <p className="text-xs text-slate-500">{t('products.sellingHint')}</p>
                      <div>
                        <Label htmlFor="shop-selling-qty">{t('products.field.sellingQuantity')}</Label>
                        <Input
                          id="shop-selling-qty"
                          className="mt-1 bg-white"
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={sellingQuantity}
                          onChange={(e) => setSellingQuantity(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shop-selling-unit">{t('products.field.sellingUnit')}</Label>
                        <select
                          id="shop-selling-unit"
                          className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          value={sellingUnit}
                          onChange={(e) => setSellingUnit(e.target.value)}
                        >
                          {SELLING_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label
                        htmlFor="shop-featured"
                        className="flex min-h-11 items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <input
                          id="shop-featured"
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-[var(--brand-navy,#1e3a5f)]"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                        />
                        <span>
                          <span className="font-medium text-slate-900">
                            {t('products.field.featured')}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-600">
                            {t('products.featuredHint')}
                          </span>
                        </span>
                      </label>
                    </>
                  ) : null}
                  {sellingMessage ? (
                    <p className="text-xs text-slate-600">{sellingMessage}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
                      disabled={sellingSaving}
                    >
                      {sellingSaving ? t('action.saving') : t('action.saveChanges')}
                    </Button>
                    {canManage && detail.status !== 'archived' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={sellingSaving}
                        onClick={async () => {
                          setSellingSaving(true)
                          const result = await fetchStaffApi<{ item: ProductDetail }>(
                            `/api/staff/products/${detail.id}`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'archived' }),
                            }
                          )
                          setSellingSaving(false)
                          if (!result.ok) {
                            setSellingMessage(result.error)
                            return
                          }
                          setDetail(result.data.item)
                          setSellingMessage(t('products.archived'))
                          void loadList(query, status, page)
                        }}
                      >
                        {t('products.archive')}
                      </Button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {loading ? <p className="text-xs text-slate-400">{t('products.refreshing')}</p> : null}
    </div>
  )
}
