'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCompanyLogo } from '@/app/actions/admin-branding'
import { COMPANY } from '@/lib/company/constants'

type Props = {
  initialLogoUrl?: string
}

export default function SiteBrandingPanel({ initialLogoUrl = '/images/energy-logics-logo.png' }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'brand')

      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.hint ? `${data.error} — ${data.hint}` : data.error)

      setLogoUrl(data.url)
      setMessage('Image uploaded — click Save logo to apply site-wide.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setMessage('')
    const result = await updateCompanyLogo(logoUrl)
    if (!result.success) {
      setError(result.error || 'Save failed')
      return
    }
    setMessage('Logo updated. Refresh the public site to see changes.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Used in the site header, admin sidebar, and browser tab. Default: Energy & Logics logo bundled with the site.
        </p>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg border bg-white overflow-hidden">
            <Image src={logoUrl} alt={`${COMPANY.brandName} logo`} fill className="object-contain p-1" unoptimized />
          </div>
          <div className="text-sm">
            <p className="font-medium">{COMPANY.brandName}</p>
            <p className="text-slate-600 break-all">{logoUrl}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="logo-url">Logo URL</Label>
          <Input
            id="logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="/images/energy-logics-logo.png"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="logo-file">Upload new logo</Label>
          <Input
            id="logo-file"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="mt-1"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={uploading} className="bg-[#1e3a5f]">
            Save logo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLogoUrl('/images/energy-logics-logo.png')}
          >
            Reset to bundled logo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
