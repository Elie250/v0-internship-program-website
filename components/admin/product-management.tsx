'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    sku: '',
    status: 'published',
  })

  const load = async () => {
    const res = await fetch('/api/products?status=')
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        images: [],
        specifications: {},
      }),
    })
    setForm({ name: '', description: '', price: '', stock: '0', sku: '', status: 'published' })
    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add Product</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <Textarea className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={handleCreate} className="md:col-span-2 bg-[#1e3a5f]">Create Product</Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {p.price} RWF · Stock {p.stock} · {p.status}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
