'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { computeFinalPrice } from '@/lib/enrollment/packages'

type AdminPackage = {
  id: string
  courseId: string
  name: string
  description: string | null
  benefits: string | null
  currency: string
  listPrice: number
  discountAmount: number
  finalPrice: number
  isActive: boolean
  sortOrder: number
}

type StudentPreviewPackage = {
  id: string
  name: string
  description: string | null
  benefits: string | null
  listPrice: number
  discountAmount: number
  finalPrice: number
}

const emptyForm = {
  name: '',
  description: '',
  benefits: '',
  listPrice: '0',
  discountAmount: '0',
  sortOrder: '0',
  isActive: true,
}

function money(value: number) {
  return `${value.toLocaleString()} RWF`
}

export function CoursePackagesPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPackages, setPreviewPackages] = useState<StudentPreviewPackage[]>([])

  const previewFinal = useMemo(() => {
    try {
      return computeFinalPrice(Number(form.listPrice || 0), Number(form.discountAmount || 0))
    } catch {
      return null
    }
  }, [form.listPrice, form.discountAmount])

  async function load() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/courses/${courseId}/packages`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Failed to load packages')
      return
    }
    setPackages(data.packages ?? [])
    setWarning(data.warning ?? null)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setSuccess('')
    setError('')
  }

  function startEdit(pkg: AdminPackage) {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description ?? '',
      benefits: pkg.benefits ?? '',
      listPrice: String(pkg.listPrice),
      discountAmount: String(pkg.discountAmount),
      sortOrder: String(pkg.sortOrder),
      isActive: pkg.isActive,
    })
    setSuccess('')
    setError('')
  }

  async function save() {
    setSaving(true)
    setError('')
    setSuccess('')
    const payload = {
      name: form.name,
      description: form.description,
      benefits: form.benefits,
      listPrice: Number(form.listPrice),
      discountAmount: Number(form.discountAmount),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    }
    const res = await fetch(
      editingId
        ? `/api/admin/courses/${courseId}/packages/${editingId}`
        : `/api/admin/courses/${courseId}/packages`,
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Save failed')
      return
    }
    setSuccess(editingId ? 'Package updated.' : 'Package created.')
    setEditingId(null)
    setForm(emptyForm)
    await load()
  }

  async function setActive(pkg: AdminPackage, isActive: boolean) {
    setError('')
    setSuccess('')
    const res = await fetch(`/api/admin/courses/${courseId}/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isActive ? 'activate' : 'deactivate' }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Update failed')
      return
    }
    setSuccess(isActive ? 'Package activated.' : 'Package deactivated.')
    await load()
  }

  async function openPreview() {
    setError('')
    const res = await fetch(`/api/admin/courses/${courseId}/packages?preview=student`)
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Preview failed')
      return
    }
    setPreviewPackages(data.packages ?? [])
    setPreviewOpen(true)
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pricing packages — {courseTitle}</CardTitle>
        <p className="text-xs text-slate-600">
          One-time packages only. When any package is active, students must select one at enrollment.
          The legacy course price is used only when there are no active packages.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {warning ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{warning}</p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={startCreate}>
            New package
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void openPreview()}>
            Preview student selection
          </Button>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading packages…</p> : null}

        <div className="space-y-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {pkg.name}{' '}
                  <Badge variant="outline">{pkg.isActive ? 'Active' : 'Inactive'}</Badge>
                </p>
                <p className="text-xs text-slate-600">
                  List {money(pkg.listPrice)}
                  {pkg.discountAmount > 0 ? ` · Discount ${money(pkg.discountAmount)}` : ''}
                  {' · Final '}
                  {money(pkg.finalPrice)}
                  {' · Order '}
                  {pkg.sortOrder}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => startEdit(pkg)}>
                  Edit
                </Button>
                {pkg.isActive ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void setActive(pkg, false)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => void setActive(pkg, true)}>
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!loading && packages.length === 0 ? (
            <p className="text-sm text-slate-600">No packages yet. Students will use the legacy course price.</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-3 space-y-3">
          <p className="text-sm font-semibold text-slate-900">{editingId ? 'Edit package' : 'Create package'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pkg-name">Name</Label>
              <Input id="pkg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pkg-description">Description</Label>
              <Textarea
                id="pkg-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pkg-benefits">Benefits</Label>
              <Textarea
                id="pkg-benefits"
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                rows={4}
                placeholder="One benefit per line"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-list">List price (RWF)</Label>
              <Input
                id="pkg-list"
                type="number"
                min="0"
                step="1"
                value={form.listPrice}
                onChange={(e) => setForm({ ...form, listPrice: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-discount">Discount (RWF)</Label>
              <Input
                id="pkg-discount"
                type="number"
                min="0"
                step="1"
                value={form.discountAmount}
                onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-sort">Sort order</Label>
              <Input
                id="pkg-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Final price (server)</Label>
              <p className="text-sm font-medium text-slate-900 pt-2">
                {previewFinal == null ? 'Invalid list/discount' : money(previewFinal)}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active for new enrollments
          </label>
          <Button type="button" onClick={() => void save()} disabled={saving || previewFinal == null}>
            {saving ? 'Saving…' : editingId ? 'Save package' : 'Create package'}
          </Button>
        </div>

        {previewOpen ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-950">Student selection preview (read-only)</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            {previewPackages.length === 0 ? (
              <p className="text-sm text-amber-950">No active packages. Students will see the legacy course price.</p>
            ) : (
              previewPackages.map((pkg) => (
                <div key={pkg.id} className="rounded-md border border-amber-200 bg-white px-3 py-2">
                  <p className="font-medium text-slate-900">{pkg.name}</p>
                  {pkg.description ? <p className="text-sm text-slate-600 mt-1">{pkg.description}</p> : null}
                  {pkg.benefits ? (
                    <pre className="text-xs text-slate-600 mt-2 whitespace-pre-wrap font-sans">{pkg.benefits}</pre>
                  ) : null}
                  <p className="text-sm text-slate-800 mt-2">
                    {pkg.discountAmount > 0
                      ? `${money(pkg.listPrice)} − ${money(pkg.discountAmount)} = `
                      : ''}
                    <span className="font-semibold">{money(pkg.finalPrice)}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
