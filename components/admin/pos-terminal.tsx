'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Product = {
  id: string
  name: string
  price: number
  discount?: number
  stock: number
  sku?: string
}

type CartLine = {
  productId: string
  name: string
  price: number
  quantity: number
  maxStock: number
}

export default function PosTerminal() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerName, setCustomerName] = useState('Walk-in customer')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'irembopay'>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/products?status=published')
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, 12)
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
    )
  }, [products, query])

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)

  const addToCart = (product: Product) => {
    const price = Number(product.price) - Number(product.discount ?? 0)
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price,
          quantity: 1,
          maxStock: product.stock,
        },
      ]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(l.maxStock, l.quantity + delta)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    )
  }

  const completeSale = async () => {
    if (!cart.length) return
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          customerName,
          customerPhone,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sale failed')
      setMessage(`${data.message} Ref: ${data.orderNumber}`)
      setCart([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-portal-content space-y-6">
      <AdminSectionHeader
        title="Point of Sale"
        description="In-store sales terminal — scan products, take payment, and update stock automatically."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by name or SKU…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((product) => {
              const price = Number(product.price) - Number(product.discount ?? 0)
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product)}
                  className="text-left rounded-lg border border-slate-200 bg-white p-3 hover:border-[var(--brand-navy)] hover:shadow-sm transition disabled:opacity-50"
                >
                  <p className="font-semibold text-sm text-slate-900 line-clamp-2">{product.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{product.sku ?? 'No SKU'}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-[var(--brand-navy)]">{price.toLocaleString()} RWF</span>
                    <span className="text-xs text-slate-500">Stock: {product.stock}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShoppingCart className="h-5 w-5" /> Current sale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-600">Tap products to add them to the sale.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((line) => (
                  <li key={line.productId} className="flex items-center gap-2 text-sm border-b pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{line.name}</p>
                      <p className="text-xs text-slate-600">
                        {(line.price * line.quantity).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(line.productId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{line.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(line.productId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateQty(line.productId, -999)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-lg bg-slate-50 border p-3 flex justify-between font-bold text-slate-900">
              <span>Total</span>
              <span>{subtotal.toLocaleString()} RWF</span>
            </div>

            <div>
              <Label>Customer name</Label>
              <Input className="mt-1" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input className="mt-1" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash — instant</SelectItem>
                  <SelectItem value="momo">MTN MoMo — pending verification</SelectItem>
                  <SelectItem value="irembopay">IremboPay — pending gateway</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">{message}</p> : null}

            <Button
              className="w-full bg-[var(--brand-navy)] text-white"
              disabled={submitting || cart.length === 0}
              onClick={completeSale}
            >
              {submitting ? 'Processing…' : 'Complete sale'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
