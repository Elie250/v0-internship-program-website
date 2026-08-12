'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

type OnboardingPayload = {
  kind?: string
  canUseEmployerWorkspace?: boolean
  hasCandidateProfile?: boolean
  companyName?: string | null
  requestStatus?: string | null
  requestType?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  nextStep?: string
  user?: { email?: string }
  error?: string
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function EmployerPendingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<OnboardingPayload | null>(null)

  const load = useCallback(async () => {
    setError('')
    const res = await fetch('/api/recruitment/employer/onboarding', { credentials: 'same-origin' })
    if (res.status === 401) {
      router.replace('/jobs/auth/continue?redirect=/employer/pending')
      return
    }
    const body = (await res.json()) as OnboardingPayload
    if (!res.ok) {
      setError(body.error || 'Could not load status')
      setLoading(false)
      return
    }
    if (body.canUseEmployerWorkspace) {
      router.replace('/employer')
      return
    }
    if (body.kind === 'pending_invite') {
      router.replace('/employer/invitation')
      return
    }
    setData(body)
    setLoading(false)
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => null)
    router.replace('/jobs')
  }

  if (loading) {
    return (
      <TalentShell title="Your hiring account is being set up">
        <LoadingBlock label="Checking approval status…" />
      </TalentShell>
    )
  }

  const statusLabel = data?.requestStatus ?? 'pending'
  const isRejected = statusLabel === 'rejected'

  return (
    <TalentShell
      title="Your hiring account is being set up"
      subtitle="Your account has been created successfully."
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

        <p className="text-sm text-slate-600 leading-relaxed">
          To protect organizations and candidates, hiring access must be approved before you can manage
          jobs or applicants.
        </p>

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Company</dt>
            <dd className="font-medium text-slate-900">{data?.companyName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Request status</dt>
            <dd className="font-medium text-slate-900 capitalize">{statusLabel.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
            <dd className="text-slate-800">{formatDate(data?.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Approval state</dt>
            <dd className="text-slate-800">
              {isRejected
                ? 'Not approved'
                : statusLabel === 'approved'
                  ? 'Approved'
                  : 'Awaiting Energy & Logics review or company invite'}
            </dd>
          </div>
          {data?.reviewNotes ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Notes</dt>
              <dd className="text-slate-800">{data.reviewNotes}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Next step</dt>
            <dd className="text-slate-800">{data?.nextStep}</dd>
          </div>
          {data?.user?.email ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Signed in as</dt>
              <dd className="text-slate-800">{data.user.email}</dd>
            </div>
          ) : null}
        </dl>

        <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>
            If your company already uses this platform, ask your company administrator to invite this
            email address.
          </p>
          <p>
            If you are registering a new hiring partner, Energy &amp; Logics will review your organization
            request and activate your company workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setLoading(true)
              void load()
            }}
            className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
          >
            Check approval status
          </Button>
          <Link href="/jobs">
            <Button variant="outline" className="rounded-xl">
              Browse jobs
            </Button>
          </Link>
          <Button variant="outline" className="rounded-xl" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>

        {data?.hasCandidateProfile ? (
          <p className="text-sm text-slate-600 pt-2 border-t border-slate-100">
            Already looking for a job too?{' '}
            <Link href="/app" className="font-medium text-[var(--brand-navy)] hover:underline">
              Continue as a candidate
            </Link>
          </p>
        ) : null}
      </div>
    </TalentShell>
  )
}
