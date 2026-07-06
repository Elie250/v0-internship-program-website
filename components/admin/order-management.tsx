'use client'

import { useEffect, useState } from 'react'
import { reviewPayment } from '@/app/actions/admin-payments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Phone, Mail, MapPin, Package, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'

type OrderItem = {
  id: string
  product_name?: string
  quantity: number
  unit_price: number
  line_total?: number
}

type OrderPayment = {
  id: string
  amount: number
  status: string
  payment_method: string | null
  receipt_url: string | null
  receipt_number: string | null
  admin_notes: string | null
  created_at: string
}

type ShopOrder = {
  id: string
  order_number?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  fulfillment_type?: string
  delivery_address?: string | null
  notes?: string | null
  total_amount: number
  status: string
  payment_status?: string | null
  payment_method?: string | null
  created_at: string
  items?: OrderItem[]
  payment?: OrderPayment | null
}

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
]

function statusBadge(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'completed') return <Badge className="bg-green-100 text-green-700">Completed</Badge>
  if (normalized === 'cancelled') return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
  if (normalized === 'confirmed') return <Badge className="bg-blue-100 text-blue-700">Confirmed</Badge>
  return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reviewingPaymentId, setReviewingPaymentId] = useState<string | null>(null)
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const deleteOrder = async (orderId: string, orderNumber?: string) => {
    const label = orderNumber ?? orderId.slice(0, 8)
    if (
      !confirm(
        `Delete order ${label}? This removes the order and restores stock if it was not already cancelled.`
      )
    ) {
      return
    }

    setDeletingId(orderId)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete order')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order')
    } finally {
      setDeletingId(null)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) load()
  }

  const handlePaymentReview = async (paymentId: string, decision: 'approved' | 'rejected') => {
    setReviewingPaymentId(paymentId)
    setError('')
    const result = await reviewPayment({
      id: paymentId,
      decision,
      adminNotes: paymentNotes[paymentId],
    })
    setReviewingPaymentId(null)
    if (!result.success) {
      setError(result.error || 'Payment review failed')
      return
    }
    await load()
  }

  const paymentStatusBadge = (status: string) => {
    if (status === 'approved' || status === 'Paid') {
      return <Badge className="bg-green-100 text-green-700">Payment accepted</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700">Payment rejected</Badge>
    }
    if (status === 'gateway_pending') {
      return <Badge className="bg-blue-100 text-blue-700">Awaiting IremboPay</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-900">Receipt pending review</Badge>
  }

  const isPaymentPendingReview = (payment?: OrderPayment | null) =>
    Boolean(
      payment &&
        ['pending_review', 'Pending', 'pending'].includes(payment.status)
    )

  const filtered = orders.filter((order) => {
    if (filter === 'all') return true
    return order.status?.toLowerCase() === filter
  })

  if (loading) {
    return <p className="text-slate-600">Loading orders...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product orders</h1>
          <p className="text-slate-600 mt-1">
            Review MoMo receipts and approve product payments here. Approving marks the order as paid and confirmed.
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for pickup</SelectItem>
            <SelectItem value="out_for_delivery">Out for delivery</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            No shop orders yet. Orders appear here when customers submit the cart from the shop page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {order.order_number ?? order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(order.created_at).toLocaleString()} ·{' '}
                      {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Local pickup'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(order.status)}
                    <Select
                      value={order.status?.toLowerCase() ?? 'pending'}
                      onValueChange={(value) => updateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      disabled={deletingId === order.id}
                      onClick={() => deleteOrder(order.id, order.order_number)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingId === order.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">{order.customer_name ?? 'Unknown customer'}</p>
                    {order.customer_email ? (
                      <p className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${order.customer_email}`} className="hover:underline">
                          {order.customer_email}
                        </a>
                      </p>
                    ) : null}
                    {order.customer_phone ? (
                      <p className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${order.customer_phone}`} className="hover:underline">
                          {order.customer_phone}
                        </a>
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {order.fulfillment_type === 'delivery' && order.delivery_address ? (
                      <p className="flex items-start gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        {order.delivery_address}
                      </p>
                    ) : (
                      <p className="text-slate-600">Pickup at Energy & Logics — Kigali</p>
                    )}
                    {order.notes ? (
                      <p className="text-slate-600">
                        <span className="font-medium text-foreground">Notes:</span> {order.notes}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit</th>
                        <th className="text-right p-2">Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items ?? []).map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-2">{item.product_name ?? 'Product'}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{Number(item.unit_price).toLocaleString()}</td>
                          <td className="p-2 text-right">
                            {Number(item.line_total ?? item.unit_price * item.quantity).toLocaleString()} RWF
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span>{Number(order.total_amount).toLocaleString()} RWF</span>
                </div>

                <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">Payment &amp; receipt</p>
                    {order.payment
                      ? paymentStatusBadge(order.payment.status)
                      : order.payment_status
                        ? paymentStatusBadge(order.payment_status)
                        : (
                          <Badge className="bg-slate-200 text-slate-700">No payment linked</Badge>
                        )}
                  </div>

                  {order.payment ? (
                    <>
                      <p className="text-sm text-slate-600">
                        {Number(order.payment.amount).toLocaleString()} RWF
                        {order.payment.payment_method ? ` · ${order.payment.payment_method}` : ''}
                        {order.payment.receipt_number ? ` · Ref ${order.payment.receipt_number}` : ''}
                      </p>

                      {order.payment.receipt_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={order.payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View MoMo receipt
                          </a>
                        </Button>
                      ) : (
                        <p className="text-xs text-amber-800">No receipt uploaded for this order.</p>
                      )}

                      {isPaymentPendingReview(order.payment) ? (
                        <div className="border-t pt-3 space-y-2">
                          <Label htmlFor={`pay-notes-${order.payment.id}`}>Admin notes</Label>
                          <Input
                            id={`pay-notes-${order.payment.id}`}
                            placeholder="Optional note after visual check…"
                            value={paymentNotes[order.payment.id] ?? ''}
                            onChange={(e) =>
                              setPaymentNotes((prev) => ({
                                ...prev,
                                [order.payment!.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-700 hover:bg-green-800 text-white"
                              disabled={reviewingPaymentId === order.payment.id}
                              onClick={() => handlePaymentReview(order.payment!.id, 'approved')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {reviewingPaymentId === order.payment.id
                                ? 'Approving…'
                                : 'Approve payment'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-800 hover:bg-red-50"
                              disabled={reviewingPaymentId === order.payment.id}
                              onClick={() => handlePaymentReview(order.payment!.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject payment
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Payment record not found. Customer may still be completing checkout.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
