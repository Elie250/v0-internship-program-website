'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', slug: '', type: 'shop', description: '' })

  const load = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'published' }),
    })
    setForm({ name: '', slug: '', type: 'shop', description: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Type (learning|shop|support|career)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={handleCreate} className="md:col-span-2 bg-[#1e3a5f]">Create Category</Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-3">
        {categories.map((c) => (
          <Card key={c.id}><CardContent className="pt-6 text-sm"><strong>{c.name}</strong><br />{c.type} · {c.slug}</CardContent></Card>
        ))}
      </div>
    </div>
  )
}
