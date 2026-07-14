import Link from 'next/link'
import { CheckCircle2, Package, XCircle } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { lookupOrder } from '@/lib/shop/order-lookup'
import { COMPANY } from '@/lib/company/constants'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ code: string }>
}

export default async function OrderReceiptLookupPage({ params }: PageProps) {
  const { code } = await params
  const result = await lookupOrder(code)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-5">
          {result.status === 'found' ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" />
                <h1 className="text-2xl font-bold text-slate-900">Order found</h1>
                <p className="text-slate-600 text-sm">
                  Official {COMPANY.legalName} order details for delivery or refund reference.
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 text-sm space-y-2.5">
                <p>
                  <span className="text-slate-500">Order code:</span>{' '}
                  <strong className="font-mono text-slate-900">{result.orderNumber}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Customer:</span>{' '}
                  <strong className="text-slate-900">{result.customerName}</strong>
                </p>
                {result.customerPhone ? (
                  <p>
                    <span className="text-slate-500">Phone:</span>{' '}
                    <strong className="text-slate-900">{result.customerPhone}</strong>
                  </p>
                ) : null}
                <p>
                  <span className="text-slate-500">Fulfillment:</span>{' '}
                  <strong className="text-slate-900">
                    {result.fulfillmentType === 'delivery' ? 'Delivery' : 'Local pickup'}
                  </strong>
                </p>
                {result.fulfillmentType === 'delivery' && result.deliveryAddress ? (
                  <p>
                    <span className="text-slate-500">Address:</span>{' '}
                    <strong className="text-slate-900">{result.deliveryAddress}</strong>
                  </p>
                ) : null}
                <p>
                  <span className="text-slate-500">Status:</span>{' '}
                  <strong className="text-slate-900 capitalize">
                    {result.orderStatus.replace(/_/g, ' ')}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Payment:</span>{' '}
                  <strong className="text-slate-900">
                    {[result.paymentStatus, result.paymentMethod].filter(Boolean).join(' · ') || '—'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong className="text-slate-900">
                    {new Date(result.orderDate).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Total:</span>{' '}
                  <strong className="text-slate-900">
                    {result.totalAmount.toLocaleString()} RWF
                  </strong>
                </p>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left p-2 font-medium text-slate-600">Item</th>
                      <th className="text-right p-2 font-medium text-slate-600">Qty</th>
                      <th className="text-right p-2 font-medium text-slate-600">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, index) => (
                      <tr key={`${item.productName}-${index}`} className="border-b last:border-0">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{item.lineTotal.toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Keep this order code with your paper receipt when claiming a refund.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <XCircle className="h-14 w-14 mx-auto text-red-500" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Order not found</h1>
                <p className="text-slate-600 text-sm">
                  No order matches{' '}
                  <span className="font-mono text-slate-800">
                    {result.orderNumber || code}
                  </span>
                  .
                </p>
              </div>
              <Package className="h-8 w-8 mx-auto text-slate-300" />
            </div>
          )}

          <p className="text-center text-sm">
            <Link href="/" className="text-[var(--brand-navy,#3a3a3a)] underline">
              Back to {COMPANY.brandName}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
