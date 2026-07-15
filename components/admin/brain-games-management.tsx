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
import { ImageUploadField } from '@/components/admin/image-upload-field'
import type {
  BrainGameCatalogRow,
  BrainGamesDiagReport,
} from '@/lib/brain-training/admin-catalog'
import { Eye, EyeOff, Pencil, RefreshCw } from 'lucide-react'

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(
      text?.includes('Server Components')
        ? 'Got an HTML error page instead of JSON. Hard-refresh after deploy, then try again.'
        : text?.slice(0, 240) || `Request failed (${res.status})`
    )
  }
}

export default function BrainGamesManagement() {
  const [games, setGames] = useState<BrainGameCatalogRow[]>([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [diag, setDiag] = useState<BrainGamesDiagReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [editing, setEditing] = useState<BrainGameCatalogRow | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    short_tagline: '',
    thumbnail_url: '',
    sort_order: 100,
    estimated_minutes: 4,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  const loadDiagnostics = async () => {
    try {
      const res = await fetch('/api/admin/brain-games?diagnose=1', { cache: 'no-store' })
      const data = await readJson(res)
      if (data.report) setDiag(data.report as BrainGamesDiagReport)
      if (!res.ok && data.error) setError(String(data.error))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostics failed')
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/admin/brain-games', { cache: 'no-store' })
      const data = await readJson(res)
      if (data.report) setDiag(data.report as BrainGamesDiagReport)

      if (!res.ok || data.success === false) {
        setError(String(data.error || `Failed to load games (${res.status})`))
        setGames([])
        if (!data.report) await loadDiagnostics()
        return
      }

      const nextGames = Array.isArray(data.games) ? (data.games as BrainGameCatalogRow[]) : []
      setGames(nextGames)
      if (data.seeded) {
        setInfo(`Synced ${nextGames.length} drills from the app catalog into the database.`)
      } else if (nextGames.length === 0) {
        setError(
          'Catalog is empty after seed. Check diagnostics — SQL may have run on a different Supabase project than production.'
        )
        if (!data.report) await loadDiagnostics()
      } else {
        setDiag(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
      setGames([])
      await loadDiagnostics()
    } finally {
      setLoading(false)
    }
  }

  const syncCatalog = async () => {
    setSeeding(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/admin/brain-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await readJson(res)
      if (data.report) setDiag(data.report as BrainGamesDiagReport)
      if (!res.ok || data.success === false) {
        setError(String(data.error || 'Sync failed'))
        return
      }
      setInfo(`Synced ${Number(data.count) || 0} drills.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      await loadDiagnostics()
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openEdit = (game: BrainGameCatalogRow) => {
    setEditing(game)
    setForm({
      name: game.name,
      description: game.description,
      short_tagline: game.short_tagline,
      thumbnail_url: game.thumbnail_url || '',
      sort_order: game.sort_order,
      estimated_minutes: game.estimated_minutes,
      is_active: game.is_active,
    })
  }

  const save = async () => {
    if (!editing?.id) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/brain-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          name: form.name,
          description: form.description,
          short_tagline: form.short_tagline,
          thumbnail_url: form.thumbnail_url || null,
          sort_order: form.sort_order,
          estimated_minutes: form.estimated_minutes,
          is_active: form.is_active,
        }),
      })
      const data = await readJson(res)
      if (!res.ok || data.success === false) {
        setError(String(data.error || 'Save failed'))
        return
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (game: BrainGameCatalogRow) => {
    if (!game.id) return
    try {
      const res = await fetch('/api/admin/brain-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: game.id, is_active: !game.is_active }),
      })
      const data = await readJson(res)
      if (!res.ok || data.success === false) {
        setError(String(data.error || 'Update failed'))
        return
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brain Training games</h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload a thumbnail cover for each drill. Covers show on the public Arcade shelf.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading || seeding}
          onClick={() => void syncCatalog()}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Syncing…' : 'Sync catalog'}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-700 rounded-lg border border-red-200 bg-red-50 px-3 py-2 whitespace-pre-wrap">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-emerald-800 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          {info}
        </p>
      ) : null}

      {loading ? (
        <p className="text-slate-600">Loading games…</p>
      ) : games.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 space-y-4">
          <p className="text-sm text-slate-700">
            No drills loaded from production Supabase. Run{' '}
            <code className="text-xs bg-white px-1 py-0.5 rounded border">
              scripts/64-brain-games-bootstrap.sql
            </code>{' '}
            in the project matching Vercel <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>, then
            Sync.
          </p>
          {diag ? (
            <ul className="text-xs text-slate-600 space-y-1 font-mono bg-white border border-slate-200 rounded-md p-3">
              <li>clientReady: {String(diag.supabaseClientReady)}</li>
              <li>urlSet: {String(diag.urlSet)}</li>
              <li>serviceRoleKeySet: {String(diag.serviceRoleKeySet)}</li>
              <li>urlValid: {String(diag.urlValid)}</li>
              <li>hostname: {diag.hostname || '—'}</li>
              {diag.urlIssue ? <li>urlIssue: {diag.urlIssue}</li> : null}
              <li>selectOk: {String(diag.selectOk)}</li>
              <li>selectCount: {diag.selectCount}</li>
              {diag.selectError ? (
                <li className="text-red-700 whitespace-pre-wrap">selectError: {diag.selectError}</li>
              ) : null}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[var(--brand-navy)] text-white"
              disabled={seeding}
              onClick={() => void syncCatalog()}
            >
              Sync catalog now
            </Button>
            <Button type="button" variant="outline" onClick={() => void loadDiagnostics()}>
              Run diagnostics
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card key={game.id || game.slug} className="overflow-hidden border-slate-200">
              <div className="relative h-36 bg-slate-100">
                {game.thumbnail_url ? (
                  <Image src={game.thumbnail_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                    No thumbnail yet
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">{game.name}</CardTitle>
                <p className="text-xs text-slate-500">
                  {game.slug} · {game.category}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(game)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit cover
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void toggleActive(game)}>
                  {game.is_active ? (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" /> Hidden
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Display name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Short tagline</Label>
              <Input
                value={form.short_tagline}
                onChange={(e) => setForm((f) => ({ ...f, short_tagline: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <ImageUploadField
              label="Game thumbnail / cover art"
              folder="brain-games"
              value={form.thumbnail_url}
              onChange={(url) => setForm((f) => ({ ...f, thumbnail_url: url }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label>Minutes (approx)</Label>
                <Input
                  type="number"
                  value={form.estimated_minutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimated_minutes: Number(e.target.value) || 4 }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Visible on Arcade
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[var(--brand-navy)] text-white"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
