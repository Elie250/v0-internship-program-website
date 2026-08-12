'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

function VerifyInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const redirectParam = searchParams.get('redirect')
  const safeRedirect =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : '/app'
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
        router.replace(data.redirectTo || safeRedirect)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed')
        setStatus('')
      }
    })()
  }, [token, router, safeRedirect])

  return (
    <TalentShell title="Signing you in">
      <div className="mx-auto max-w-md space-y-4">
        {status ? <LoadingBlock label={status} /> : null}
        {error ? (
          <>
            <StatusBanner tone="error">{error}</StatusBanner>
            <Link href="/jobs/auth/continue" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
              Request a new link
            </Link>
          </>
        ) : null}
      </div>
    </TalentShell>
  )
}

export default function JobsAuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <TalentShell title="Signing you in">
          <LoadingBlock label="Loading…" />
        </TalentShell>
      }
    >
      <VerifyInner />
    </Suspense>
  )
}
