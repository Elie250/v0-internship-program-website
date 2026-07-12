'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ENGINEERING_ARTICLE_TAGS } from '@/lib/engineering/articles'

type DigestSubscriber = {
  email: string
  name: string | null
  preferred_tags: string[]
  frequency: 'weekly' | 'off'
  status: 'active' | 'unsubscribed'
  unsubscribe_token: string | null
}

export function DigestPreferencesPanel({
  token,
  unsubscribed = false,
}: {
  token?: string | null
  unsubscribed?: boolean
}) {
  const [subscriber, setSubscriber] = useState<DigestSubscriber | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [frequency, setFrequency] = useState<'weekly' | 'off'>('weekly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const query = token ? `?token=${encodeURIComponent(token)}` : ''

  useEffect(() => {
    void fetch(`/api/engineering/digest/preferences${query}`, { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data.subscriber) {
          setSubscriber(data.subscriber)
          setSelectedTags(data.subscriber.preferred_tags ?? [])
          setFrequency(data.subscriber.frequency ?? 'weekly')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [query, token])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/engineering/digest/preferences${query}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ preferredTags: selectedTags, frequency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSubscriber(data.subscriber)
      setMessage('Preferences saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const unsubscribe = async () => {
    if (!confirm('Unsubscribe from The Weekly Circuit?')) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/engineering/digest/unsubscribe${query}`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unsubscribe failed')
      setMessage('You have been unsubscribed.')
      setFrequency('off')
      if (subscriber) setSubscriber({ ...subscriber, status: 'unsubscribed', frequency: 'off' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unsubscribe failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading preferences…</p>
  }

  if (!subscriber) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          No digest subscription found for this link. Subscribe on any Field Notes page or log in
          with the email you used.
        </p>
        <Button asChild className="bg-[var(--brand-navy)] text-white">
          <Link href="/engineering">Browse Field Notes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unsubscribed || subscriber.status === 'unsubscribed' ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          You are unsubscribed from The Weekly Circuit.
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}

      <div>
        <p className="text-sm text-slate-600">
          Managing digest for <strong>{subscriber.email}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select
          value={frequency}
          onValueChange={(value) => setFrequency(value as typeof frequency)}
          disabled={subscriber.status === 'unsubscribed'}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly (Tuesdays)</SelectItem>
            <SelectItem value="off">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preferred topics (empty = all topics)</Label>
        <div className="flex flex-wrap gap-2">
          {ENGINEERING_ARTICLE_TAGS.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                disabled={subscriber.status === 'unsubscribed'}
                className={`text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => void save()}
          disabled={saving || subscriber.status === 'unsubscribed'}
          className="bg-[var(--brand-navy)] text-white"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
        {subscriber.status === 'active' ? (
          <Button variant="outline" onClick={() => void unsubscribe()} disabled={saving}>
            Unsubscribe
          </Button>
        ) : null}
        <Button variant="ghost" asChild>
          <Link href="/engineering">Back to Field Notes</Link>
        </Button>
      </div>
    </div>
  )
}
