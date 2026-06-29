'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

type Lesson = {
  id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
}

export function CourseContentPanel({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [form, setForm] = useState({
    title: '',
    content_type: 'video',
    content_url: '',
    sort_order: '0',
  })
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/admin/courses/${courseId}/content`)
    const data = await res.json()
    setLessons(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
  }, [courseId])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    await fetch(`/api/admin/courses/${courseId}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        sort_order: Number(form.sort_order),
      }),
    })
    setForm({ title: '', content_type: 'video', content_url: '', sort_order: '0' })
    await load()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this lesson?')) return
    await fetch(`/api/admin/course-content/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="font-medium text-sm">Course lessons (visible to admitted students)</p>
      {lessons.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {lessons.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2">
              <span>
                {l.title}{' '}
                <span className="text-muted-foreground">({l.content_type})</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No lessons yet — add videos, PDFs, or links below.</p>
      )}
      <div className="grid gap-3">
        <div>
          <Label>Lesson title</Label>
          <Input
            className="mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Introduction to PLC"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video (YouTube URL)</SelectItem>
                <SelectItem value="pdf">PDF / document</SelectItem>
                <SelectItem value="link">External link</SelectItem>
                <SelectItem value="download">Download file URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Order</Label>
            <Input
              className="mt-1"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Content URL</Label>
          <Input
            className="mt-1"
            value={form.content_url}
            onChange={(e) => setForm({ ...form, content_url: e.target.value })}
            placeholder="https://youtube.com/... or PDF link"
          />
        </div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={loading} className="bg-[#1e3a5f]">
          Add lesson
        </Button>
      </div>
    </div>
  )
}
