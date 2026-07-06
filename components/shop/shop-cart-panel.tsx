'use client'

import Image from 'next/image'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { COMPANY } from '@/lib/company/constants'
import { useState } from 'react'

export function ShopCartPanel() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useShopCart()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
    notes: '',
  })

  const resetCheckout = () => {
    setStep('cart')
    setError('')
    setOrderNumber('')
    setForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      fulfillmentType: 'pickup',
      deliveryAddress: '',
      notes: '',
    })
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')

      setOrderNumber(data.orderNumber)
      clearCart()
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetCheckout()
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary" className="relative bg-white text-[#1e3a5f] hover:bg-white/90">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 ? (
            <span className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center px-1">
              {itemCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 'success' ? 'Order submitted' : step === 'checkout' ? 'Checkout' : 'Your cart'}
          </SheetTitle>
          <SheetDescription>
            {step === 'success'
              ? 'Thank you — our team will contact you shortly.'
              : step === 'checkout'
                ? 'Provide contact details for delivery or local pickup in Kigali.'
                : 'Review items before submitting your order request.'}
          </SheetDescription>
        </SheetHeader>

        {step === 'success' ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border bg-green-50 p-4 text-sm">
              <p className="font-medium text-green-800">Order reference: {orderNumber}</p>
              <p className="text-green-700 mt-2">
                {COMPANY.brandName} will call or email you at the contact details you provided to confirm
                availability, total, and {form.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'} arrangements.
              </p>
            </div>
            <Button className="w-full bg-[#1e3a5f]" onClick={() => { setOpen(false); resetCheckout() }}>
              Continue shopping
            </Button>
          </div>
        ) : step === 'checkout' ? (
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="customerName">Full name</Label>
              <Input
                id="customerName"
                className="mt-1"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                className="mt-1"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone (WhatsApp preferred)</Label>
              <Input
                id="customerPhone"
                className="mt-1"
                placeholder="+250..."
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Fulfillment</Label>
              <Select
                value={form.fulfillmentType}
                onValueChange={(value) => setForm({ ...form, fulfillmentType: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Local pickup — {COMPANY.address}</SelectItem>
                  <SelectItem value="delivery">Delivery (we will contact you for details)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.fulfillmentType === 'delivery' ? (
              <div>
                <Label htmlFor="deliveryAddress">Delivery address</Label>
                <Textarea
                  id="deliveryAddress"
                  className="mt-1"
                  placeholder="District, sector, street, landmarks..."
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                className="mt-1"
                placeholder="Preferred contact time, product questions..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{subtotal.toLocaleString()} RWF</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Payment is arranged after we confirm your order (MTN MoMo or cash on pickup).
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('cart')}>
                Back
              </Button>
              <Button className="flex-1 bg-[#1e3a5f]" disabled={submitting} onClick={handleSubmitOrder}>
                Submit order
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your cart is empty. Browse products and add items.</p>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 border rounded-lg p-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} RWF each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border p-3 flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()} RWF</span>
                </div>
                <Button className="w-full bg-[#1e3a5f]" onClick={() => setStep('checkout')}>
                  Proceed to checkout
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
