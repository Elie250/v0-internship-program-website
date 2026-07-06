'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteHeader } from '@/components/layout/site-header'
import { COMPANY } from '@/lib/company/constants'
import { CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      setSuccess(data.message ?? 'Password updated.')
      setTimeout(() => router.push('/auth/login?message=password_reset'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8">
            <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">At least 6 characters.</p>

            {!token ? (
              <div className="space-y-4">
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                  Invalid reset link. Request a new one from the login page.
                </p>
                <Link href="/auth/forgot-password">
                  <Button className="w-full bg-[var(--brand-navy)] text-white">Request reset link</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {success ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success} Redirecting to sign in…</span>
                  </div>
                ) : null}
                {error ? (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                ) : null}

                <div>
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || Boolean(success)}
                  className="w-full h-11 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">© {new Date().getFullYear()} {COMPANY.brandName}</p>
        </div>
      </div>
    </div>
  )
}
