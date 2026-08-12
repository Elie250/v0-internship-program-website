'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

type MePayload = {
  isPlatformAdmin?: boolean
  memberships?: unknown[]
  onboardingKind?: string
  error?: string
}

export default function AuthChoosePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canHire, setCanHire] = useState(false)
  const [hiringHref, setHiringHref] = useState('/employer/pending')
  const [hiringLabel, setHiringLabel] = useState('Hiring access pending')
  const [hiringBlurb, setHiringBlurb] = useState(
    'Your hiring request is awaiting approval or a company invitation.'
  )

  useEffect(() => {
    void (async () => {
      const [meRes, onboardingRes] = await Promise.all([
        fetch('/api/recruitment/me', { credentials: 'same-origin' }),
        fetch('/api/recruitment/employer/onboarding', { credentials: 'same-origin' }),
      ])
      if (meRes.status === 401) {
        router.replace('/jobs/auth/continue')
        return
      }
      const data = (await meRes.json()) as MePayload
      if (!meRes.ok) {
        setError(data.error || 'Could not load your account')
        setLoading(false)
        return
      }

      const onboarding = onboardingRes.ok ? await onboardingRes.json() : null
      const active =
        Boolean(data.isPlatformAdmin) ||
        (Array.isArray(data.memberships) && data.memberships.length > 0) ||
        onboarding?.canUseEmployerWorkspace
      setCanHire(Boolean(active))

      if (active) {
        setHiringHref('/employer')
        setHiringLabel('Hiring workspace')
        setHiringBlurb('Jobs, applications, and your company team.')
      } else if (onboarding?.kind === 'pending_invite') {
        setHiringHref('/employer/invitation')
        setHiringLabel('Accept company invitation')
        setHiringBlurb('You have a pending invitation to a hiring workspace.')
      } else {
        setHiringHref('/employer/pending')
        setHiringLabel('Hiring access pending')
        setHiringBlurb(
          'Your account is ready. Energy & Logics approval or a company invite unlocks hiring.'
        )
      }
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
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Candidate
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Looking for a job</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">Profile, CV, and applications.</p>
        </Link>
        <Link
          href={hiringHref}
          className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Hiring
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{hiringLabel}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{hiringBlurb}</p>
          {!canHire ? (
            <p className="mt-3 text-xs text-slate-500">Workspace unlocks after approval or invite.</p>
          ) : null}
        </Link>
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
