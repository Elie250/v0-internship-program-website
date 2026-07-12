'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download } from 'lucide-react'
import type { EngineeringLeadMagnet } from '@/lib/engineering/lead-magnets'

export function LeadMagnetCard({ magnet }: { magnet: EngineeringLeadMagnet }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const download = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/engineering/lead-magnets/${magnet.slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Download failed')
      setFileUrl(data.fileUrl)
      if (data.fileUrl) window.open(data.fileUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex items-start gap-2">
        <Download className="h-5 w-5 text-[var(--brand-navy)] mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-slate-900">{magnet.title}</h3>
          {magnet.description ? (
            <p className="text-sm text-slate-600 mt-1">{magnet.description}</p>
          ) : null}
        </div>
      </div>
      {fileUrl ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">
          Download started. You&apos;re also subscribed to The Weekly Circuit digest.
        </p>
      ) : (
        <>
          {error ? (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`lm-name-${magnet.id}`}>Name (optional)</Label>
            <Input
              id={`lm-name-${magnet.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`lm-email-${magnet.id}`}>Email</Label>
            <Input
              id={`lm-email-${magnet.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <Button
            onClick={() => void download()}
            disabled={loading || !email.trim()}
            className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 w-full"
          >
            {loading ? 'Preparing…' : 'Download free PDF'}
          </Button>
          <p className="text-xs text-slate-500">Free download · also joins The Weekly Circuit email list</p>
        </>
      )}
    </div>
  )
}
