'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
            Energy &amp; Logics Talent
          </p>
          <CardTitle className="text-slate-900">Continue with Email</CardTitle>
          <p className="text-sm text-slate-600">
            Passwordless sign-in. We email you a one-time link — no recruitment password to create
            or reset.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
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
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            >
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-4">
            <Link href="/jobs" className="underline text-[var(--brand-navy)]">
              Back to Talent home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default function JobsContinueWithEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-slate-600">
          Loading…
        </main>
      }
    >
      <ContinueInner />
    </Suspense>
  )
}
