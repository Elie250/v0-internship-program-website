'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Pencil, Trash2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  sku?: string
  status: string
  images?: string[]
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '0',
  sku: '',
  status: 'published',
  imageUrl: '',
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/products?status=all')
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          sku: form.sku,
          status: form.status,
          images: form.imageUrl ? [form.imageUrl] : [],
          specifications: {},
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')

      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock ?? 0),
      sku: product.sku || '',
      status: product.status || 'published',
      imageUrl: product.images?.[0] || '',
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
          sku: editForm.sku,
          status: editForm.status,
          images: editForm.imageUrl ? [editForm.imageUrl] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-slate-600 mt-1">Add, edit, and manage shop products with images.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Product name</Label>
            <Input
              className="mt-1"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>SKU</Label>
            <Input
              className="mt-1"
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div>
            <Label>Price (RWF)</Label>
            <Input
              className="mt-1"
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <Label>Stock</Label>
            <Input
              className="mt-1"
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              className="mt-1"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <ImageUploadField
              label="Product image"
              folder="products"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
          <Button onClick={handleCreate} disabled={saving} className="md:col-span-2 bg-[#1e3a5f]">
            Create product
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            {p.images?.[0] ? (
              <div className="relative h-40 w-full border-b">
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="h-40 bg-muted flex items-center justify-center text-sm text-slate-600 border-b">
                No image
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 line-clamp-2">{p.description}</p>
              <p className="text-sm">
                {p.price?.toLocaleString()} RWF · Stock {p.stock} · {p.status}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                className="mt-1"
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <ImageUploadField
              label="Product image"
              folder="products"
              value={editForm.imageUrl}
              onChange={(url) => setEditForm({ ...editForm, imageUrl: url })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-[#1e3a5f]">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
