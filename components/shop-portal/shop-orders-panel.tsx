'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { fetchStaffApi, type StaffListResponse } from '@/lib/shop/staff-client'
import { ShopListPagination } from '@/components/shop-portal/shop-list-pagination'
import { useShopI18n, useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { shopPaymentStatusLabel } from '@/lib/shop/i18n/translate'
import { isPendingPaymentStatus } from '@/lib/payments/status'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

type StaffPayment = {
  amount: number
  status: string
  paymentMethod: string | null
  proofUrl: string | null
  referenceNumber: string | null
  notes: string | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  paidAt: string | null
}

type OrderSummary = {
  id: string
  orderNumber: string | null
  channel: string | null
  status: string | null
  paymentStatus: string | null
  paymentMethod: string | null
  totalAmount: number
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  orderDate: string | null
  createdAt: string | null
  payment: StaffPayment | null
}

type OrderDetail = OrderSummary & {
  notes: string | null
  deliveryAddress: string | null
  items: Array<{
    id: string
    productName: string
    quantity: number
    sellingUnit: string | null
    unitPrice: number
    lineTotal: number
  }>
}

const FULFILLMENT_KEYS: Record<string, ShopMessageKey> = {
  pending: 'common.pending',
  confirmed: 'orders.confirmed',
  ready_for_pickup: 'orders.readyForPickup',
  out_for_delivery: 'orders.outForDelivery',
  completed: 'orders.completed',
  cancelled: 'action.cancel',
}

function formatWhen(value: string | null, locale: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === 'rw' ? 'rw-RW' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function ShopOrdersPanel({
  canReviewPayments,
  canManageFulfillment,
}: {
  canReviewPayments: boolean
  canManageFulfillment: boolean
}) {
  const t = useShopT()
  const { locale } = useShopI18n()
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [items, setItems] = useState<OrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [notes, setNotes] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | 'fulfill' | null>(null)
  const [proofOpen, setProofOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState('ready_for_pickup')
  const [, startTransition] = useTransition()

  const loadList = useEffectEvent(async (pg: number) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({
      page: String(pg),
      limit: String(limit),
      channel: 'online',
    })
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
    setActionError('')
    const result = await fetchStaffApi<{ item: OrderDetail }>(`/api/staff/orders/${id}`)
    if (!result.ok) {
      setDetailError(result.error)
      return
    }
    setDetail(result.data.item)
    const status = result.data.item.status ?? ''
    if (status === 'confirmed') setNextStatus('ready_for_pickup')
    else if (status === 'ready_for_pickup') setNextStatus('out_for_delivery')
    else if (status === 'out_for_delivery') setNextStatus('completed')
    else setNextStatus(status || 'ready_for_pickup')
  })

  useEffect(() => {
    startTransition(() => {
      void loadList(page)
    })
  }, [page])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setNotes('')
      return
    }
    void loadDetail(selectedId)
  }, [selectedId])

  const pendingItems = items.filter(
    (row) =>
      isPendingPaymentStatus(row.paymentStatus) ||
      isPendingPaymentStatus(row.payment?.status)
  )
  const otherItems = items.filter((row) => !pendingItems.some((pending) => pending.id === row.id))

  async function reviewPayment(decision: 'approve' | 'reject') {
    if (!selectedId || !canReviewPayments) return
    setBusy(decision)
    setActionError('')
    const result = await fetchStaffApi<{ success: boolean }>('/api/staff/payments/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedId,
        decision,
        adminNotes: notes.trim() || undefined,
      }),
    })
    setBusy(null)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setNotes('')
    await loadList(page)
    await loadDetail(selectedId)
  }

  async function updateFulfillment() {
    if (!selectedId || !canManageFulfillment) return
    setBusy('fulfill')
    setActionError('')
    const result = await fetchStaffApi<{ success: boolean }>(`/api/staff/orders/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    setBusy(null)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    await loadList(page)
    await loadDetail(selectedId)
  }

  const paymentPending =
    detail &&
    (isPendingPaymentStatus(detail.paymentStatus) ||
      isPendingPaymentStatus(detail.payment?.status))
  const paymentPaid = detail?.paymentStatus === 'paid' || detail?.payment?.status === 'approved'
  const proofUrl = detail?.payment?.proofUrl ?? null

  function orderStatusLabel(raw: string | null) {
    if (!raw) return t('common.emDash')
    const key = FULFILLMENT_KEYS[raw.toLowerCase()]
    return key ? t(key) : raw
  }

  function renderOrderRows(rows: OrderSummary[]) {
    return rows.map((row) => (
      <tr
        key={row.id}
        className={`cursor-pointer border-b border-slate-100 last:border-0 ${
          selectedId === row.id ? 'bg-slate-50' : 'hover:bg-slate-50/80'
        }`}
        onClick={() => setSelectedId(row.id)}
      >
        <td className="px-3 py-2.5 font-medium text-slate-900">
          {row.orderNumber || t('common.order')}
          <span className="block text-xs font-normal text-slate-500">
            {formatWhen(row.orderDate || row.createdAt, locale)}
          </span>
        </td>
        <td className="px-3 py-2.5 text-slate-700">
          {row.customerName || t('common.emDash')}
          {row.customerPhone ? (
            <span className="block text-xs text-slate-500">{row.customerPhone}</span>
          ) : null}
        </td>
        <td className="px-3 py-2.5 text-slate-700">
          {row.paymentMethod === 'momo' ? t('orders.momoPayment') : row.paymentMethod || t('common.emDash')}
          <span className="block text-xs text-slate-500">
            {shopPaymentStatusLabel(locale, row.paymentStatus)}
          </span>
        </td>
        <td className="px-3 py-2.5 tabular-nums font-medium text-slate-900">
          {formatShopRwf(row.totalAmount)}
        </td>
      </tr>
    ))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{t('orders.onlineQueueNote')}</p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm overflow-hidden">
            <header className="px-3 py-2.5 border-b border-amber-100">
              <h2 className="text-sm font-semibold text-amber-950">{t('orders.pendingTitle')}</h2>
              <p className="text-xs text-amber-900/80">{t('orders.paymentAwaiting')}</p>
            </header>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t('common.order')}</th>
                    <th className="px-3 py-2">{t('common.customer')}</th>
                    <th className="px-3 py-2">{t('common.payment')}</th>
                    <th className="px-3 py-2">{t('orders.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {renderOrderRows(pendingItems)}
                  {!loading && pendingItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                        {t('orders.noPending')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <header className="px-3 py-2.5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">{t('orders.fulfillment')}</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t('common.order')}</th>
                    <th className="px-3 py-2">{t('common.customer')}</th>
                    <th className="px-3 py-2">{t('common.payment')}</th>
                    <th className="px-3 py-2">{t('orders.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {renderOrderRows(otherItems)}
                  {!loading && otherItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                        {t('orders.empty')}
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
          </section>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[240px]">
          {!selectedId ? (
            <p className="text-sm text-slate-600">{t('orders.selectHint')}</p>
          ) : detailError ? (
            <p className="text-sm text-red-700">{detailError}</p>
          ) : !detail ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {detail.orderNumber || t('common.order')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {orderStatusLabel(detail.status)} ·{' '}
                  {shopPaymentStatusLabel(locale, detail.paymentStatus)}
                </p>
              </div>

              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('common.customer')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.customerName || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('orders.phone')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.customerPhone || t('common.emDash')}
                  </dd>
                </div>
                {detail.customerEmail ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">{t('orders.email')}</dt>
                    <dd className="font-medium text-slate-900 break-all">{detail.customerEmail}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('orders.amount')}</dt>
                  <dd className="tabular-nums font-semibold text-[var(--brand-navy,#1e3a5f)]">
                    {formatShopRwf(detail.payment?.amount || detail.totalAmount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('common.payment')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.paymentMethod === 'momo'
                      ? t('orders.momoPayment')
                      : detail.paymentMethod || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('orders.paymentReference')}</dt>
                  <dd className="font-medium text-slate-900">
                    {detail.payment?.referenceNumber || t('common.emDash')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('orders.submittedAt')}</dt>
                  <dd className="font-medium text-slate-900">
                    {formatWhen(detail.payment?.submittedAt || detail.createdAt, locale)}
                  </dd>
                </div>
                {detail.payment?.reviewedBy || detail.payment?.reviewedAt ? (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">{t('orders.reviewedBy')}</dt>
                      <dd className="font-medium text-slate-900">
                        {detail.payment?.reviewedBy || t('common.emDash')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">{t('orders.reviewedAt')}</dt>
                      <dd className="font-medium text-slate-900">
                        {formatWhen(detail.payment?.reviewedAt, locale)}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>

              {proofUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{t('orders.paymentProof')}</p>
                  <button
                    type="button"
                    className="block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    onClick={() => setProofOpen(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt={t('orders.paymentProof')}
                      className="max-h-56 w-full object-contain bg-white"
                    />
                  </button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setProofOpen(true)}>
                    {t('orders.openProof')}
                  </Button>
                </div>
              ) : null}

              {detail.items?.length ? (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  <li className="py-2 text-xs uppercase tracking-wide text-slate-500">
                    {t('orders.items')}
                  </li>
                  {detail.items.map((line) => (
                    <li key={line.id} className="py-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-slate-900 line-clamp-2">{line.productName}</p>
                        <p className="tabular-nums font-medium shrink-0">
                          {formatShopRwf(line.lineTotal)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatShopInteger(line.quantity)}
                        {line.sellingUnit ? ` ${line.sellingUnit}` : ''} × {formatShopRwf(line.unitPrice)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {actionError ? <p className="text-sm text-red-700">{actionError}</p> : null}

              {canReviewPayments && paymentPending ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <Label htmlFor="order-review-notes">{t('orders.notesLabel')}</Label>
                  <Textarea
                    id="order-review-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={t('orders.notesPlaceholder')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-[var(--brand-navy,#1e3a5f)]"
                      disabled={busy != null}
                      onClick={() => void reviewPayment('approve')}
                    >
                      {busy === 'approve' ? t('orders.approving') : t('orders.approvePayment')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={busy != null}
                      onClick={() => void reviewPayment('reject')}
                    >
                      {busy === 'reject' ? t('orders.rejecting') : t('orders.rejectPayment')}
                    </Button>
                  </div>
                </div>
              ) : null}

              {canManageFulfillment && paymentPaid ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <Label htmlFor="order-fulfillment">{t('orders.fulfillment')}</Label>
                  <select
                    id="order-fulfillment"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value)}
                  >
                    <option value="confirmed">{t('orders.confirmed')}</option>
                    <option value="ready_for_pickup">{t('orders.readyForPickup')}</option>
                    <option value="out_for_delivery">{t('orders.outForDelivery')}</option>
                    <option value="completed">{t('orders.completed')}</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy != null}
                    onClick={() => void updateFulfillment()}
                  >
                    {busy === 'fulfill' ? t('orders.updating') : t('orders.updateStatus')}
                  </Button>
                </div>
              ) : canManageFulfillment && !paymentPaid ? (
                <p className="text-xs text-slate-500">{t('orders.fulfillmentPaidOnly')}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('orders.paymentProof')}</DialogTitle>
          </DialogHeader>
          {proofUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proofUrl} alt={t('orders.paymentProof')} className="max-h-[80vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
