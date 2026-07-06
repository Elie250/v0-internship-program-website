'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Save } from 'lucide-react'

type StockRow = {
  id: string
  name: string
  sku: string | null
  stock: number
  low_stock_threshold: number | null
  status: string
  price: number
}

export default function StockManagement() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [draft, setDraft] = useState<Record<string, { stock: string; threshold: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stock')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setRows(list)
      setDraft(
        Object.fromEntries(
          list.map((row: StockRow) => [
            row.id,
            {
              stock: String(row.stock ?? 0),
              threshold: String(row.low_stock_threshold ?? 5),
            },
          ])
        )
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const lowStockCount = useMemo(() => {
    return rows.filter((row) => {
      const stock = Number(draft[row.id]?.stock ?? row.stock ?? 0)
      const threshold = Number(draft[row.id]?.threshold ?? row.low_stock_threshold ?? 5)
      return stock > 0 && stock <= threshold
    }).length
  }, [rows, draft])

  const outOfStockCount = useMemo(() => {
    return rows.filter((row) => Number(draft[row.id]?.stock ?? row.stock ?? 0) <= 0).length
  }, [rows, draft])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updates = rows.map((row) => ({
        id: row.id,
        stock: Number(draft[row.id]?.stock ?? row.stock),
        low_stock_threshold: Number(draft[row.id]?.threshold ?? row.low_stock_threshold ?? 5),
      }))

      const res = await fetch('/api/admin/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      setMessage('Stock levels updated.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-600">Loading inventory...</p>
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock management</h1>
          <p className="text-slate-600 mt-1">
            Update inventory levels. Stock decreases automatically when customers submit shop orders.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a5f] shrink-0">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : 'Save all changes'}
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Products tracked</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{lowStockCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Out of stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{outOfStockCount}</CardContent>
        </Card>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Low-stock alert at</th>
                  <th className="p-3 font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const stock = Number(draft[row.id]?.stock ?? row.stock ?? 0)
                  const threshold = Number(draft[row.id]?.threshold ?? row.low_stock_threshold ?? 5)
                  const level =
                    stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'ok'

                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3 text-slate-600">{row.sku ?? '—'}</td>
                      <td className="p-3">{row.status}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={draft[row.id]?.stock ?? '0'}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              [row.id]: { ...draft[row.id], stock: e.target.value },
                            })
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={draft[row.id]?.threshold ?? '5'}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              [row.id]: { ...draft[row.id], threshold: e.target.value },
                            })
                          }
                        />
                      </td>
                      <td className="p-3">
                        {level === 'out' ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : level === 'low' ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">In stock</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="relative z-[60] flex justify-end pt-4 border-t border-slate-200">
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a5f] w-full sm:w-auto pointer-events-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : 'Save all changes'}
        </Button>
      </div>
    </div>
  )
}
