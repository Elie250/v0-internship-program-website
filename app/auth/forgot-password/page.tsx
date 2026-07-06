'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteHeader } from '@/components/layout/site-header'
import { COMPANY } from '@/lib/company/constants'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
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
            <Link href="/auth/login" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Enter your account email and we will send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              ) : null}
              {error ? (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
              ) : null}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || Boolean(message)}
                className="w-full h-11 bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90 text-white"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">© {new Date().getFullYear()} {COMPANY.brandName}</p>
        </div>
      </div>
    </div>
  )
}
