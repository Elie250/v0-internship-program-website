'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'

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
      <p className="text-xs text-slate-500">
        Read-only sales history from staff order APIs. Order edits and refunds are not available here.
      </p>

      <div className="flex flex-wrap gap-3">
        <div>
          <Label htmlFor="sales-channel" className="sr-only">
            Channel
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
            <option value="">All channels</option>
            <option value="pos">POS</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sales-pay" className="sr-only">
            Payment status
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
            <option value="">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending_review">Pending review</option>
            <option value="gateway_pending">Gateway pending</option>
            <option value="approved">Approved</option>
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
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Total</th>
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
                            : '—'}
                          {row.customerName ? ` · ${row.customerName}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{row.channel || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.paymentStatus || '—'}
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
                      No sales found.
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
            <p className="text-sm text-slate-600">Select a sale to view details.</p>
          ) : detailError ? (
            <p className="text-sm text-red-700">{detailError}</p>
          ) : !detail ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {detail.orderNumber || 'Order'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detail.channel} · {detail.status} · {detail.paymentStatus}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
              </div>

              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Total</dt>
                  <dd className="tabular-nums font-semibold text-[var(--brand-navy,#1e3a5f)]">
                    {formatShopRwf(detail.totalAmount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Customer</dt>
                  <dd className="font-medium text-slate-900">{detail.customerName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-900">{detail.locationName || '—'}</dd>
                </div>
                {detail.payment ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Payment</dt>
                    <dd className="font-medium text-slate-900">
                      {formatShopRwf(detail.payment.amount)} · {detail.payment.status}
                    </dd>
                  </div>
                ) : null}
                {detail.stockState ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Stock state</dt>
                    <dd className="font-medium text-slate-900">{detail.stockState}</dd>
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
                          ? ` · cost ${formatShopRwf(line.unitCost)}`
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
