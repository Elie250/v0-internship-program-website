'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/recruitment/talent-ui'

export function EmailMagicForm({
  mode,
  registerIntent,
  redirect,
  companyName,
  submitLabel,
  extraFields,
}: {
  mode: 'signin' | 'register'
  registerIntent?: 'candidate' | 'employer'
  redirect?: string | null
  companyName?: string
  submitLabel: string
  extraFields?: ReactNode
}) {
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
        body: JSON.stringify({
          email,
          mode,
          registerIntent,
          redirect: redirect ?? undefined,
          companyName: companyName || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessage(data.message || 'Check your email for a link.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      {extraFields}
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
        {busy ? 'Sending…' : submitLabel}
      </Button>
    </form>
  )
}

export function AuthCardFooter({
  signInHref = '/jobs/auth/continue',
  registerHref = '/jobs/register',
  showSignIn,
  showRegister,
}: {
  signInHref?: string
  registerHref?: string
  showSignIn?: boolean
  showRegister?: boolean
}) {
  return (
    <div className="text-sm text-slate-600 space-y-2">
      {showRegister ? (
        <p>
          New here?{' '}
          <Link href={registerHref} className="font-medium text-[var(--brand-navy)] hover:underline">
            Create an account
          </Link>
        </p>
      ) : null}
      {showSignIn ? (
        <p>
          Already have an account?{' '}
          <Link href={signInHref} className="font-medium text-[var(--brand-navy)] hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  )
}
