'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DigestSubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/engineering/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Subscription failed')
      setMessage('Subscribed — watch your inbox for The Weekly Circuit.')
      setEmail('')
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'rounded-xl border border-slate-200 bg-white p-5 space-y-4'}>
      {!compact ? (
        <div>
          <h3 className="font-semibold text-slate-900">The Weekly Circuit</h3>
          <p className="text-sm text-slate-600 mt-1">
            Free <strong>weekly</strong> email digest of new field notes — at most one email per week,
            so we preserve quota for account and support messages.
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">
          {message}
        </p>
      ) : null}
      <div className={compact ? 'flex flex-col sm:flex-row gap-2' : 'grid sm:grid-cols-2 gap-3'}>
        {!compact ? (
          <div className="space-y-2">
            <Label htmlFor="digest-name">Name (optional)</Label>
            <Input
              id="digest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        ) : null}
        <div className="space-y-2 flex-1">
          {!compact ? <Label htmlFor="digest-email">Email</Label> : null}
          <Input
            id="digest-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <Button
        onClick={() => void submit()}
        disabled={loading || !email.trim()}
        className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
      >
        {loading ? 'Subscribing…' : 'Subscribe free'}
      </Button>
    </div>
  )
}
