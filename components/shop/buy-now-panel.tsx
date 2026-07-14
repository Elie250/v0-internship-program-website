'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
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
import { COMPANY } from '@/lib/company/constants'

type Step = 'review' | 'checkout' | 'payment' | 'success'

type Props = {
  productId: string
  name: string
  price: number
  stock: number
  image?: string
  className?: string
}

export function BuyNowPanel({ productId, name, price, stock, image, className }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('review')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
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

  const lineTotal = price * quantity

  const reset = () => {
    setStep('review')
    setQuantity(1)
    setError('')
    setOrderNumber('')
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
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId, quantity }],
          ...form,
          paymentMethod: 'momo',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      setOrderNumber(data.orderNumber)
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
    canProceedCheckout && (form.receiptUrl.trim() || form.receiptNumber.trim())

  if (stock <= 0) {
    return (
      <Button size="lg" disabled className={className}>
        Out of stock
      </Button>
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button
          size="lg"
          className={
            className ?? 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
          }
        >
          Order now
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-slate-200 bg-white text-slate-900">
        <SheetHeader>
          <SheetTitle className="text-slate-900">
            {step === 'success'
              ? 'Order submitted'
              : step === 'payment'
                ? 'MoMo payment'
                : step === 'checkout'
                  ? 'Your details'
                  : 'Order this item'}
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {step === 'success'
              ? 'Thank you — our team will contact you shortly.'
              : step === 'payment'
                ? 'Pay with MTN MoMo and upload your receipt.'
                : step === 'checkout'
                  ? 'Contact details for delivery or pickup in Kigali.'
                  : 'Order directly — no cart needed.'}
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
              className="w-full bg-[var(--brand-navy)] text-white"
              onClick={() => {
                setOpen(false)
                reset()
              }}
            >
              Done
            </Button>
          </div>
        ) : step === 'payment' ? (
          <div className="mt-6 space-y-4 px-1">
            <MomoPayCard amountLabel={`Order total: ${lineTotal.toLocaleString()} RWF`} />
            <div>
              <Label htmlFor="buy-now-receipt">MoMo receipt *</Label>
              <Input
                id="buy-now-receipt"
                type="file"
                accept="image/*,application/pdf"
                className="mt-1"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleReceiptUpload(file)
                }}
              />
              {form.receiptUrl ? (
                <p className="text-xs text-emerald-700 mt-1">Receipt uploaded.</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="buy-now-receipt-no">MoMo reference / receipt number</Label>
              <Input
                id="buy-now-receipt-no"
                className="mt-1"
                value={form.receiptNumber}
                onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                placeholder="Optional if receipt image uploaded"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('checkout')}>
                Back
              </Button>
              <Button
                className="flex-1 bg-[var(--brand-navy)] text-white"
                disabled={!canSubmitPayment || submitting}
                onClick={() => void handleSubmitOrder()}
              >
                {submitting ? 'Submitting…' : 'Submit order'}
              </Button>
            </div>
          </div>
        ) : step === 'checkout' ? (
          <div className="mt-6 space-y-4 px-1">
            <div>
              <Label htmlFor="buy-now-name">Full name *</Label>
              <Input
                id="buy-now-name"
                className="mt-1"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="buy-now-email">Email *</Label>
              <Input
                id="buy-now-email"
                type="email"
                className="mt-1"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="buy-now-phone">Phone *</Label>
              <Input
                id="buy-now-phone"
                className="mt-1"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Fulfillment *</Label>
              <Select
                value={form.fulfillmentType}
                onValueChange={(v) => setForm({ ...form, fulfillmentType: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup in Kigali</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.fulfillmentType === 'delivery' ? (
              <div>
                <Label htmlFor="buy-now-address">Delivery address *</Label>
                <Textarea
                  id="buy-now-address"
                  className="mt-1"
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="buy-now-notes">Notes (optional)</Label>
              <Textarea
                id="buy-now-notes"
                className="mt-1"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('review')}>
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
          <div className="mt-6 space-y-5 px-1">
            <div className="flex gap-3 rounded-lg border border-slate-200 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {image ? (
                  <Image src={image} alt={name} fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 leading-snug">{name}</p>
                <p className="text-sm font-medium text-[var(--brand-navy)] mt-2">
                  {price.toLocaleString()} RWF each
                </p>
              </div>
            </div>

            <div>
              <Label>Quantity</Label>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  disabled={quantity >= stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-500">{stock} available</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-[var(--brand-navy)]">
                {lineTotal.toLocaleString()} RWF
              </span>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              className="w-full bg-[var(--brand-navy)] text-white"
              onClick={() => setStep('checkout')}
            >
              Continue
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
