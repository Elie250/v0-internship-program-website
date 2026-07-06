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
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'

type Service = {
  id: string
  title: string
  description: string
  category?: string
  image_url?: string | null
  is_published: boolean
}

const emptyForm = {
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  is_published: false,
}

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadServices = async () => {
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading services:', err)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleAddService = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          image_url: form.imageUrl || null,
          is_published: form.is_published,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add service')

      setForm(emptyForm)
      await loadServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add service')
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (service: Service) => {
    setEditing(service)
    setEditForm({
      title: service.title,
      description: service.description,
      category: service.category || '',
      imageUrl: service.image_url || '',
      is_published: service.is_published,
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/services/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          image_url: editForm.imageUrl || null,
          is_published: editForm.is_published,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setEditing(null)
      await loadServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePublish = async (service: Service) => {
    await fetch(`/api/admin/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !service.is_published }),
    })
    loadServices()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    loadServices()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-slate-600 mt-1">Manage engineering services with images and publish status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add new service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1"
              placeholder="Service title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              className="mt-1"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <ImageUploadField
            label="Service image"
            folder="services"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publish-new"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            <label htmlFor="publish-new" className="text-sm">
              Publish immediately
            </label>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={handleAddService} disabled={isLoading} className="w-full bg-[#1e3a5f]">
            <Plus className="w-4 h-4 mr-2" />
            Add service
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {services.length === 0 ? (
              <p className="text-slate-600 col-span-full">No services created yet.</p>
            ) : (
              services.map((service) => (
                <div key={service.id} className="border border-border rounded-lg overflow-hidden">
                  {service.image_url ? (
                    <div className="relative h-36 w-full">
                      <Image
                        src={service.image_url}
                        alt={service.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-36 bg-muted flex items-center justify-center text-sm text-slate-600">
                      No image
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Category: {service.category || 'N/A'} ·{' '}
                          {service.is_published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => togglePublish(service)}>
                          {service.is_published ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteService(service.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                className="mt-1"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <ImageUploadField
              label="Service image"
              folder="services"
              value={editForm.imageUrl}
              onChange={(url) => setEditForm({ ...editForm, imageUrl: url })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish-edit"
                checked={editForm.is_published}
                onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
              />
              <label htmlFor="publish-edit" className="text-sm">
                Published
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="bg-[#1e3a5f]">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
