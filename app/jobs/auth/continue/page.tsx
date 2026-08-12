'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandMark, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

function ContinueInner() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/recruitment/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect: redirect ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessage(data.message || 'Check your email for a sign-in link.')
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        setMessage(
          `${data.message || 'Check your email for a sign-in link.'} After signing in, you will return to your previous page.`
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <TalentShell title="Continue with Email" subtitle="Passwordless sign-in for candidates. No password to create or reset.">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_18px_50px_-36px_rgba(30,58,95,0.45)] space-y-6">
          <div className="sm:hidden">
            <BrandMark compact />
          </div>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work or personal email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-xl"
              />
            </div>
            {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
            {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
            >
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
          </form>
          <p className="text-xs text-slate-500 leading-relaxed">
            We send a one-time link to your inbox. Use the same email whenever you apply — your
            profile and CV stay with you across employers.
          </p>
          <p className="text-sm">
            <Link href="/jobs" className="font-medium text-[var(--brand-navy)] hover:underline">
              ← Back to job board
            </Link>
          </p>
        </div>
      </div>
    </TalentShell>
  )
}

export default function JobsContinueWithEmailPage() {
  return (
    <Suspense
      fallback={
        <TalentShell title="Continue with Email">
          <p className="text-slate-600">Loading…</p>
        </TalentShell>
      }
    >
      <ContinueInner />
    </Suspense>
  )
}
