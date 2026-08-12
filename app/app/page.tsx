'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MeResponse = {
  user: { id: string; email: string; firstName?: string; lastName?: string }
  candidateProfile: {
    headline: string | null
    phone: string | null
    location: string | null
    linkedin_url: string | null
    portfolio_url: string | null
    summary: string | null
  } | null
  memberships: unknown[]
}

export default function CandidateAppPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [me, setMe] = useState<MeResponse | null>(null)
  const [form, setForm] = useState({
    headline: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    summary: '',
  })

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
      if (res.status === 401) {
        router.replace('/jobs/auth/continue')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load')
        setLoading(false)
        return
      }
      setMe(data)
      setForm({
        headline: data.candidateProfile?.headline ?? '',
        phone: data.candidateProfile?.phone ?? '',
        location: data.candidateProfile?.location ?? '',
        linkedinUrl: data.candidateProfile?.linkedin_url ?? '',
        portfolioUrl: data.candidateProfile?.portfolio_url ?? '',
        summary: data.candidateProfile?.summary ?? '',
      })
      setLoading(false)
    })()
  }, [router])

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/recruitment/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...form, consentPrivacy: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-600">
        Loading…
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
            Candidate app · Phase 1 foundation
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Your talent profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            Signed in as {me?.user.email}. One profile for applications across employers (jobs &amp;
            screening come later).
          </p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                {message}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                value={form.portfolioUrl}
                onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <textarea
                id="summary"
                className="w-full min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <Button
              onClick={() => void save()}
              disabled={saving}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-500">
          Org memberships: {me?.memberships?.length ?? 0} ·{' '}
          <Link href="/jobs" className="underline text-[var(--brand-navy)]">
            Talent home
          </Link>
          {' · '}
          <Link href="/employer" className="underline text-[var(--brand-navy)]">
            Employer portal
          </Link>
        </p>
      </div>
    </main>
  )
}
