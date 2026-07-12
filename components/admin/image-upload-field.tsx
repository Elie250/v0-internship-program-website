'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  label?: string
  value: string
  onChange: (url: string) => void
  folder: 'products' | 'services' | 'announcements' | 'courses' | 'brand' | 'engineering' | 'energy-library'
}

export function ImageUploadField({ label = 'Image', value, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)

      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)

      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative h-24 w-24 rounded-md border overflow-hidden bg-muted">
          <Image src={value} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Image URL or upload below"
      />
      <Input
        ref={fileRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
          Remove image
        </Button>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {uploading ? <p className="text-xs text-slate-600">Uploading…</p> : null}
    </div>
  )
}
