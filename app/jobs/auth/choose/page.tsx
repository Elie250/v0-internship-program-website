'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

type MePayload = {
  isPlatformAdmin?: boolean
  memberships?: unknown[]
}

export default function AuthChoosePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canHire, setCanHire] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
      if (res.status === 401) {
        router.replace('/jobs/auth/continue')
        return
      }
      const data = (await res.json()) as MePayload
      if (!res.ok) {
        setError(data && typeof data === 'object' && 'error' in data ? String((data as { error?: string }).error) : 'Could not load your account')
        setLoading(false)
        return
      }
      setCanHire(Boolean(data.isPlatformAdmin) || (Array.isArray(data.memberships) && data.memberships.length > 0))
      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return (
      <TalentShell title="Choose where to continue">
        <LoadingBlock label="Loading your account…" />
      </TalentShell>
    )
  }

  return (
    <TalentShell
      title="Choose where to continue"
      subtitle="This email is used for both job applications and hiring. Pick a workspace — you can switch later."
    >
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="mx-auto max-w-2xl grid sm:grid-cols-2 gap-4">
        <Link
          href="/app"
          className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Candidate</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Looking for a job</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Profile, CV, and applications.
          </p>
        </Link>
        {canHire ? (
          <Link
            href="/employer"
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Hiring</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Hiring workspace</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Jobs, applications, and your company team.
            </p>
          </Link>
        ) : (
          <Link
            href="/employer/get-access"
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Hiring</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Hiring access</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Your account is ready. A company workspace is added by Energy &amp; Logics or a company admin.
            </p>
          </Link>
        )}
      </div>
      <p className="mx-auto max-w-2xl mt-6">
        <Link href="/jobs">
          <Button variant="outline" className="rounded-xl">
            Browse jobs
          </Button>
        </Link>
      </p>
    </TalentShell>
  )
}
