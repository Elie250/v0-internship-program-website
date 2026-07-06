'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Banknote,
  BookOpen,
  Headphones,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import type { FinancialSummary } from '@/lib/admin/data/financial-analytics'

function formatRwf(value: number) {
  return `${value.toLocaleString()} RWF`
}

export default function FinancialManagement() {
  const [data, setData] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/financial')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-slate-600 p-6">Loading financial data…</p>
  }

  if (!data) {
    return <p className="text-red-700 p-6">Could not load financial summary.</p>
  }

  const marginPct =
    data.shopGrossRevenue > 0
      ? Math.round((data.shopNetProfit / data.shopGrossRevenue) * 100)
      : 0

  return (
    <div className="admin-portal-content space-y-6">
      <AdminSectionHeader
        title="Financial overview"
        description="Revenue and profit across products, e-learning, and support — separate from learning delivery."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total website revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-950">{formatRwf(data.totalRevenue)}</p>
            <p className="text-xs text-emerald-800 mt-1">All verified payments &amp; paid orders</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> E-learning sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-950">{formatRwf(data.learningRevenue)}</p>
            <p className="text-xs text-blue-800 mt-1">Programme enrollments (approved)</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Products gross
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-950">{formatRwf(data.shopGrossRevenue)}</p>
            <p className="text-xs text-indigo-800 mt-1">
              {data.shopOrdersPaid} paid · {data.shopOrdersPending} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Products net profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-950">{formatRwf(data.shopNetProfit)}</p>
            <p className="text-xs text-amber-800 mt-1">
              COGS {formatRwf(data.shopCogs)} · margin ~{marginPct}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <Headphones className="h-4 w-4" /> Support subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">{formatRwf(data.supportRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> POS counter sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">{formatRwf(data.posRevenue)}</p>
            <Link href="/admin/dashboard/pos">
              <Button size="sm" variant="outline" className="mt-2">
                Open POS <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700">Pending verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">{data.pendingPaymentsCount}</p>
            <Link href="/admin/dashboard/payments">
              <Button size="sm" variant="outline" className="mt-2">
                Payments center <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Recent product orders</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentShopOrders.length === 0 ? (
            <p className="text-sm text-slate-600">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-600">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Payment</th>
                    <th className="py-2">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentShopOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{order.order_number}</td>
                      <td className="py-2 pr-4 text-slate-700">{order.customer_name}</td>
                      <td className="py-2 pr-4 text-slate-900">{formatRwf(order.total_amount)}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-2 capitalize text-slate-600">{order.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link href="/admin/dashboard/orders" className="inline-block mt-4">
            <Button variant="outline" size="sm">
              Manage all orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
