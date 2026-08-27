'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'
import { useShopI18n, useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { shopPaymentStatusLabel, shopStockStateLabel } from '@/lib/shop/i18n/translate'

type OrderSummary = {
  id: string
  orderNumber: string | null
  channel: string | null
  status: string | null
  paymentStatus: string | null
  paymentMethod: string | null
  totalAmount: number
  customerName: string | null
  locationName: string | null
  orderDate: string | null
  createdAt: string | null
}

type OrderDetail = OrderSummary & {
  notes: string | null
  deliveryAddress: string | null
  stockState: string | null
  items: Array<{
    id: string
    productId: string | null
    productName: string
    quantity: number
    unitPrice: number
    unitCost: number
    lineTotal: number
  }>
  payment: {
    id: string
    amount: number
    status: string
    paymentMethod: string | null
    createdAt: string | null
    paidAt: string | null
  } | null
}

export function ShopSalesPanel({ canSeeUnitCost }: { canSeeUnitCost: boolean }) {
  const t = useShopT()
  const { locale } = useShopI18n()
  const [channel, setChannel] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [items, setItems] = useState<OrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [, startTransition] = useTransition()

  const loadList = useEffectEvent(async (ch: string, pay: string, pg: number) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(pg), limit: String(limit) })
    if (ch) params.set('channel', ch)
    if (pay) params.set('payment_status', pay)
    const result = await fetchStaffApi<StaffListResponse<OrderSummary>>(
      `/api/staff/orders?${params.toString()}`
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
    setDetail(null)
    setDetailError('')
    const result = await fetchStaffApi<{ item: OrderDetail }>(`/api/staff/orders/${id}`)
    if (!result.ok) {
      setDetailError(result.error)
      return
    }
    setDetail(result.data.item)
  })

  useEffect(() => {
    startTransition(() => {
      void loadList(channel, paymentStatus, page)
    })
  }, [channel, paymentStatus, page])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId)
  }, [selectedId])

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{t('sales.readOnlyNote')}</p>

      <div className="flex flex-wrap gap-3">
        <div>
          <Label htmlFor="sales-channel" className="sr-only">
            {t('sales.channelLabel')}
          </Label>
          <select
            id="sales-channel"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={channel}
            onChange={(e) => {
              setPage(1)
              setChannel(e.target.value)
            }}
          >
            <option value="">{t('sales.channel.all')}</option>
            <option value="pos">{t('sales.channel.pos')}</option>
            <option value="online">{t('sales.channel.online')}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sales-pay" className="sr-only">
            {t('sales.paymentStatusLabel')}
          </Label>
          <select
            id="sales-pay"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={paymentStatus}
            onChange={(e) => {
              setPage(1)
              setPaymentStatus(e.target.value)
            }}
          >
            <option value="">{t('sales.payment.all')}</option>
            <option value="paid">{t('sales.payment.paid')}</option>
            <option value="unpaid">{t('sales.payment.unpaid')}</option>
            <option value="pending_review">{t('sales.payment.pendingReview')}</option>
            <option value="gateway_pending">{t('sales.payment.gatewayPending')}</option>
            <option value="approved">{t('sales.payment.approved')}</option>
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
                  <th className="px-3 py-2 font-medium">{t('sales.col.order')}</th>
                  <th className="px-3 py-2 font-medium">{t('sales.col.channel')}</th>
                  <th className="px-3 py-2 font-medium">{t('sales.col.payment')}</th>
                  <th className="px-3 py-2 font-medium">{t('sales.col.total')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
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
                        <p className="font-medium text-slate-900">
                          {row.orderNumber || row.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.orderDate
                            ? new Date(row.orderDate).toLocaleString()
                            : t('common.emDash')}
                          {row.customerName ? ` · ${row.customerName}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.channel || t('common.emDash')}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {shopPaymentStatusLabel(locale, row.paymentStatus)}
                        {row.paymentMethod ? (
                          <span className="block text-xs text-slate-500">{row.paymentMethod}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums font-medium text-slate-900">
                        {formatShopRwf(row.totalAmount)}
                      </td>
                    </tr>
                  )
                })}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      {t('sales.empty')}
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
            <p className="text-sm text-slate-600">{t('sales.selectHint')}</p>
          ) : detailError ? (
            <p className="text-sm text-red-700">{detailError}</p>
          ) : !detail ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {detail.orderNumber || t('sales.orderFallbackTitle')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detail.channel} · {detail.status} ·{' '}
                    {shopPaymentStatusLabel(locale, detail.paymentStatus)}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  {t('action.close')}
                </Button>
              </div>

              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('sales.field.total')}</dt>
                  <dd className="tabular-nums font-semibold text-[var(--brand-navy,#1e3a5f)]">
                    {formatShopRwf(detail.totalAmount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('sales.field.customer')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.customerName || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('sales.field.location')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.locationName || t('common.emDash')}
                  </dd>
                </div>
                {detail.payment ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">{t('sales.field.payment')}</dt>
                    <dd className="font-medium text-slate-900">
                      {formatShopRwf(detail.payment.amount)} · {detail.payment.status}
                    </dd>
                  </div>
                ) : null}
                {detail.stockState ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">{t('sales.field.stockState')}</dt>
                    <dd className="font-medium text-slate-900">
                      {shopStockStateLabel(locale, detail.stockState)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {detail.items?.length ? (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {detail.items.map((line) => (
                    <li key={line.id} className="py-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-slate-900 line-clamp-2">{line.productName}</p>
                        <p className="tabular-nums font-medium shrink-0">
                          {formatShopRwf(line.lineTotal)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatShopInteger(line.quantity)} × {formatShopRwf(line.unitPrice)}
                        {canSeeUnitCost
                          ? ` ${t('sales.lineCost', { amount: formatShopRwf(line.unitCost) })}`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
