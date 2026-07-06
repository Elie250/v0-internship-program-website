'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Globe, Minus, Plus, ShoppingCart, Smartphone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MomoPayCard } from '@/components/payment/momo-pay-card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useShopCart } from '@/lib/shop/cart-context'
import { COMPANY, PAYMENT } from '@/lib/company/constants'
import { useEffect, useState } from 'react'

type Step = 'cart' | 'checkout' | 'payment' | 'success'

export function ShopCartPanel() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useShopCart()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('cart')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [irembopayEnabled, setIrembopayEnabled] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'irembopay'>('momo')
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
    notes: '',
    receiptUrl: '',
    receiptNumber: '',
  })

  useEffect(() => {
    fetch('/api/payments/irembopay/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.enabled) {
          setIrembopayEnabled(true)
          setPaymentMethod('irembopay')
        }
      })
      .catch(() => undefined)
  }, [])

  const resetCheckout = () => {
    setStep('cart')
    setError('')
    setOrderNumber('')
    setPaymentMethod(irembopayEnabled ? 'irembopay' : 'momo')
    setForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      fulfillmentType: 'pickup',
      deliveryAddress: '',
      notes: '',
      receiptUrl: '',
      receiptNumber: '',
    })
  }

  const handleReceiptUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/public/upload-receipt', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm((prev) => ({ ...prev, receiptUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        ...form,
        paymentMethod,
      }

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')

      if (paymentMethod === 'irembopay' && data.requiresIremboPay) {
        const payRes = await fetch('/api/payments/irembopay/initiate-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, orderId: data.orderId }),
        })
        const payData = await payRes.json()
        if (!payRes.ok) throw new Error(payData.error || 'Could not start IremboPay')

        if (payData.paymentLinkUrl) {
          clearCart()
          window.location.href = payData.paymentLinkUrl
          return
        }
        throw new Error('No payment link returned')
      }

      setOrderNumber(data.orderNumber)
      clearCart()
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceedCheckout =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    form.customerPhone.trim() &&
    (form.fulfillmentType !== 'delivery' || form.deliveryAddress.trim())

  const canSubmitPayment =
    canProceedCheckout &&
    (paymentMethod === 'irembopay' || form.receiptUrl.trim() || form.receiptNumber.trim())

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetCheckout()
      }}
    >
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="relative bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 shadow-sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 ? (
            <span className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center px-1">
              {itemCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-slate-200 bg-white text-slate-900">
        <SheetHeader>
          <SheetTitle className="text-slate-900">
            {step === 'success'
              ? 'Order submitted'
              : step === 'payment'
                ? 'Choose payment'
                : step === 'checkout'
                  ? 'Checkout'
                  : 'Your cart'}
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {step === 'success'
              ? 'Thank you — our team will contact you shortly.'
              : step === 'payment'
                ? 'Select MTN MoMo (manual receipt) or IremboPay for instant payment.'
                : step === 'checkout'
                  ? 'Provide contact details for delivery or local pickup in Kigali.'
                  : 'Review items before checkout.'}
          </SheetDescription>
        </SheetHeader>

        {step === 'success' ? (
          <div className="mt-6 space-y-4 px-1">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-semibold text-green-900">Order reference: {orderNumber}</p>
              <p className="text-green-800 mt-2 leading-relaxed">
                {COMPANY.brandName} will verify your payment and confirm{' '}
                {form.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'} arrangements.
              </p>
            </div>
            <Button
              className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
              onClick={() => {
                setOpen(false)
                resetCheckout()
              }}
            >
              Continue shopping
            </Button>
          </div>
        ) : step === 'payment' ? (
          <div className="mt-6 space-y-4 px-1">
            <div className="grid grid-cols-2 gap-2">
              {irembopayEnabled ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('irembopay')}
                  className={`rounded-lg border p-3 text-left ${
                    paymentMethod === 'irembopay'
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-slate-200'
                  }`}
                >
                  <Globe className="h-4 w-4 text-indigo-700 mb-1" />
                  <p className="text-sm font-semibold text-slate-900">IremboPay</p>
                  <p className="text-xs text-slate-600">Instant · MoMo &amp; cards</p>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`rounded-lg border p-3 text-left ${
                  paymentMethod === 'momo'
                    ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5 ring-1 ring-[var(--brand-navy)]'
                    : 'border-slate-200'
                }`}
              >
                <Smartphone className="h-4 w-4 text-[var(--brand-navy)] mb-1" />
                <p className="text-sm font-semibold text-slate-900">Manual MoMo</p>
                <p className="text-xs text-slate-600">Pay Code + receipt</p>
              </button>
            </div>

            {paymentMethod === 'momo' ? (
              <>
                <MomoPayCard amountLabel={`Order total: ${subtotal.toLocaleString()} RWF`} />
                <div>
                  <Label htmlFor="receipt">MoMo receipt *</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    className="mt-1"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleReceiptUpload(file)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="receiptNumber">Transaction reference (optional)</Label>
                  <Input
                    id="receiptNumber"
                    className="mt-1 border-slate-300"
                    value={form.receiptNumber}
                    onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                {PAYMENT.internationalWorkflow}
              </p>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span>{subtotal.toLocaleString()} RWF</span>
              </div>
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('checkout')}>
                Back
              </Button>
              <Button
                className="flex-1 bg-[var(--brand-navy)] text-white"
                disabled={submitting || uploading || !canSubmitPayment}
                onClick={handleSubmitOrder}
              >
                {submitting
                  ? paymentMethod === 'irembopay'
                    ? 'Redirecting…'
                    : 'Submitting…'
                  : paymentMethod === 'irembopay'
                    ? 'Pay with IremboPay'
                    : 'Submit order'}
              </Button>
            </div>
          </div>
        ) : step === 'checkout' ? (
          <div className="mt-6 space-y-4 px-1">
            <div>
              <Label htmlFor="customerName">Full name *</Label>
              <Input
                id="customerName"
                required
                className="mt-1 border-slate-300 text-slate-900"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                required
                className="mt-1 border-slate-300 text-slate-900"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone (WhatsApp preferred) *</Label>
              <Input
                id="customerPhone"
                required
                className="mt-1 border-slate-300 text-slate-900"
                placeholder="+250..."
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Fulfillment *</Label>
              <Select
                value={form.fulfillmentType}
                onValueChange={(value) => setForm({ ...form, fulfillmentType: value })}
              >
                <SelectTrigger className="mt-1 border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Local pickup — {COMPANY.address}</SelectItem>
                  <SelectItem value="delivery">Delivery (we will contact you)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.fulfillmentType === 'delivery' ? (
              <div>
                <Label htmlFor="deliveryAddress">Delivery address *</Label>
                <Textarea
                  id="deliveryAddress"
                  required
                  className="mt-1 border-slate-300 text-slate-900"
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                className="mt-1 border-slate-300 text-slate-900"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('cart')}>
                Back
              </Button>
              <Button
                className="flex-1 bg-[var(--brand-navy)] text-white"
                disabled={!canProceedCheckout}
                onClick={() => setStep('payment')}
              >
                Continue to payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4 px-1">
            {items.length === 0 ? (
              <p className="text-sm text-slate-600">Your cart is empty. Browse products and add items.</p>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-600">{item.price.toLocaleString()} RWF each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-slate-300 text-slate-800"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center text-slate-900">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-slate-300 text-slate-800"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto text-red-700 hover:text-red-800 hover:bg-red-50"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex justify-between font-semibold text-slate-900">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()} RWF</span>
                </div>
                <Button
                  className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                  onClick={() => setStep('checkout')}
                >
                  Proceed to checkout
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  See <Link href="/terms" className="underline">Terms</Link> and{' '}
                  <Link href="/refund-policy" className="underline">Refunds</Link>
                </p>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
