'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Phone, Mail, MapPin, Package } from 'lucide-react'

type OrderItem = {
  id: string
  product_name?: string
  quantity: number
  unit_price: number
  line_total?: number
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
  created_at: string
  items?: OrderItem[]
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

  const updateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) load()
  }

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
            Customer order requests from the shop cart. Contact them to confirm payment and fulfillment.
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
