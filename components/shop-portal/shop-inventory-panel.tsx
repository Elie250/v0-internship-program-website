'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { STOCK_MOVEMENT_TYPES } from '@/lib/shop/stock-types'

type InventoryRow = {
  productId: string
  name: string
  sku: string | null
  barcode: string | null
  currentStock: number
  lowStockThreshold: number
  isLowStock: boolean
  status: string | null
  price: number
  updatedAt: string | null
  stockModel: string
}

type MovementRow = {
  id: string
  productId: string
  movementType: string
  quantityDelta: number
  quantityBefore: number | null
  quantityAfter: number | null
  reason: string | null
  orderId: string | null
  actorUserId: string | null
  createdAt: string
}

type Tab = 'levels' | 'movements'

export function ShopInventoryPanel() {
  const t = useShopT()
  const [tab, setTab] = useState<Tab>('levels')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [items, setItems] = useState<InventoryRow[]>([])
  const [movements, setMovements] = useState<MovementRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [movementType, setMovementType] = useState('')
  const [, startTransition] = useTransition()

  const loadLevels = useEffectEvent(async (q: string, pg: number) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(pg), limit: String(limit) })
    if (q.trim()) params.set('q', q.trim())
    const result = await fetchStaffApi<StaffListResponse<InventoryRow>>(
      `/api/staff/inventory?${params.toString()}`
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

  const loadMovements = useEffectEvent(async (pg: number, type: string) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(pg), limit: String(limit) })
    if (type) params.set('movement_type', type)
    const result = await fetchStaffApi<StaffListResponse<MovementRow>>(
      `/api/staff/inventory/movements?${params.toString()}`
    )
    if (!result.ok) {
      setMovements([])
      setTotal(0)
      setError(result.error)
      setLoading(false)
      return
    }
    setMovements(result.data.items ?? [])
    setTotal(result.data.total ?? 0)
    setLoading(false)
  })

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(() => {
        if (tab === 'levels') void loadLevels(query, page)
        else void loadMovements(page, movementType)
      })
    }, 220)
    return () => window.clearTimeout(handle)
  }, [tab, query, page, movementType])

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{t('inventory.readOnlyNote')}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === 'levels'
              ? 'bg-[var(--brand-navy,#1e3a5f)] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
          onClick={() => {
            setPage(1)
            setTab('levels')
          }}
        >
          {t('inventory.tab.levels')}
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === 'movements'
              ? 'bg-[var(--brand-navy,#1e3a5f)] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
          onClick={() => {
            setPage(1)
            setTab('movements')
          }}
        >
          {t('inventory.tab.movements')}
        </button>
      </div>

      {tab === 'levels' ? (
        <div>
          <Label htmlFor="inv-q" className="sr-only">
            {t('inventory.searchLabel')}
          </Label>
          <Input
            id="inv-q"
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder={t('inventory.searchPlaceholder')}
            className="bg-white max-w-md"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="inv-move-type" className="sr-only">
            {t('inventory.movementTypeLabel')}
          </Label>
          <select
            id="inv-move-type"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={movementType}
            onChange={(e) => {
              setPage(1)
              setMovementType(e.target.value)
            }}
          >
            <option value="">{t('inventory.movementType.all')}</option>
            {STOCK_MOVEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {tab === 'levels' ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.product')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.onHand')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.threshold')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.listPrice')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.flag')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.productId} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">
                        {row.sku || t('products.noSku')}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium text-slate-900">
                      {formatShopInteger(row.currentStock)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                      {formatShopInteger(row.lowStockThreshold)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                      {formatShopRwf(row.price)}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.currentStock <= 0 ? (
                        <span className="text-xs font-medium text-red-700">
                          {t('inventory.flag.out')}
                        </span>
                      ) : row.isLowStock ? (
                        <span className="text-xs font-medium text-amber-700">
                          {t('inventory.flag.low')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{t('inventory.flag.ok')}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      {t('inventory.emptyLevels')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.when')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.type')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.delta')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.beforeAfter')}</th>
                  <th className="px-3 py-2 font-medium">{t('inventory.col.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{row.movementType}</td>
                    <td className="px-3 py-2.5 tabular-nums font-medium">
                      {row.quantityDelta > 0 ? '+' : ''}
                      {formatShopInteger(row.quantityDelta)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                      {row.quantityBefore == null
                        ? t('common.emDash')
                        : formatShopInteger(row.quantityBefore)}
                      {' → '}
                      {row.quantityAfter == null
                        ? t('common.emDash')
                        : formatShopInteger(row.quantityAfter)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[200px] truncate">
                      {row.reason || t('common.emDash')}
                    </td>
                  </tr>
                ))}
                {!loading && movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      {t('inventory.emptyMovements')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
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
    </div>
  )
}
