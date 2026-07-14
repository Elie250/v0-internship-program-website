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
import {
  listBrainGamesAdmin,
  updateBrainGameAdmin,
  type BrainGameCatalogRow,
} from '@/app/actions/brain-training'
import { Eye, EyeOff, Pencil } from 'lucide-react'

export default function BrainGamesManagement() {
  const [games, setGames] = useState<BrainGameCatalogRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
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

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await listBrainGamesAdmin()
    if (!res.success) {
      setError(res.error || 'Failed to load games')
      setGames([])
    } else {
      setGames(res.games)
    }
    setLoading(false)
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
    const res = await updateBrainGameAdmin({
      id: editing.id,
      name: form.name,
      description: form.description,
      short_tagline: form.short_tagline,
      thumbnail_url: form.thumbnail_url || null,
      sort_order: form.sort_order,
      estimated_minutes: form.estimated_minutes,
      is_active: form.is_active,
    })
    setSaving(false)
    if (!res.success) {
      setError(res.error || 'Save failed')
      return
    }
    setEditing(null)
    await load()
  }

  const toggleActive = async (game: BrainGameCatalogRow) => {
    if (!game.id) return
    await updateBrainGameAdmin({ id: game.id, is_active: !game.is_active })
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Brain Training games</h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload a thumbnail cover for each drill. Covers show on the public Arcade shelf.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-700 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-slate-600">Loading games…</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card key={game.id || game.slug} className="overflow-hidden border-slate-200">
              <div className="relative h-36 bg-slate-900">
                {game.thumbnail_url ? (
                  <Image src={game.thumbnail_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    No thumbnail yet
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{game.name}</CardTitle>
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
            <label className="flex items-center gap-2 text-sm">
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
