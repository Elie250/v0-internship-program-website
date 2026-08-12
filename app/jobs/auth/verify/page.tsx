'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Verifying your sign-in link…')

  useEffect(() => {
    if (!token) {
      setError('Missing sign-in token.')
      setStatus('')
      return
    }
    void (async () => {
      try {
        const res = await fetch('/api/recruitment/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Verification failed')
        setStatus('Signed in. Redirecting…')
        router.replace(data.redirectTo || '/app')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed')
        setStatus('')
      }
    })()
  }, [token, router])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
          Energy &amp; Logics Talent
        </p>
        {status ? <p className="text-slate-800 font-medium">{status}</p> : null}
        {error ? (
          <>
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </p>
            <Link href="/jobs/auth/continue" className="text-sm text-[var(--brand-navy)] underline">
              Request a new link
            </Link>
          </>
        ) : null}
      </div>
    </main>
  )
}

export default function JobsAuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-slate-600">
          Loading…
        </main>
      }
    >
      <VerifyInner />
    </Suspense>
  )
}
