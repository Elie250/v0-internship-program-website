'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingBlock, StatusBanner, TalentShell } from '@/components/recruitment/talent-ui'

type InvitePayload = {
  invite?: {
    id: string
    email: string
    role: string
    status: string
    expiresAt: string
    organizationName?: string | null
    organizationStatus?: string | null
  }
  error?: string
}

function InvitationInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<InvitePayload['invite'] | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      // Fall back to onboarding — may have invite matched by email
      const res = await fetch('/api/recruitment/employer/onboarding', { credentials: 'same-origin' })
      if (res.status === 401) {
        router.replace('/jobs/auth/continue?redirect=/employer/invitation')
        return
      }
      const data = await res.json()
      if (data.canUseEmployerWorkspace) {
        router.replace('/employer')
        return
      }
      if (!data.pendingInvite) {
        setError('No pending invitation found for your account.')
        setLoading(false)
        return
      }
      setInvite({
        id: data.pendingInvite.id,
        email: data.pendingInvite.email,
        role: data.pendingInvite.role,
        status: 'pending',
        expiresAt: data.pendingInvite.expiresAt,
        organizationName: data.pendingInvite.organizationName,
      })
      setLoading(false)
      return
    }

    const res = await fetch(`/api/recruitment/invites/accept?token=${encodeURIComponent(token)}`, {
      credentials: 'same-origin',
    })
    const data = (await res.json()) as InvitePayload
    if (!res.ok) {
      setError(data.error || 'Invitation not found')
      setLoading(false)
      return
    }
    setInvite(data.invite ?? null)
    setLoading(false)
  }, [router, token])

  useEffect(() => {
    void load()
  }, [load])

  const accept = async () => {
    if (!token) {
      setError('Open the invitation link from your email to accept.')
      return
    }
    setBusy(true)
    setError('')
    const session = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
    if (session.status === 401) {
      router.replace(
        `/jobs/auth/continue?redirect=${encodeURIComponent(`/employer/invitation?token=${token}`)}`
      )
      return
    }
    const res = await fetch('/api/recruitment/invites/accept', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'Could not accept invitation')
      return
    }
    router.replace(data.redirectTo || '/employer')
  }

  if (loading) {
    return (
      <TalentShell title="Company invitation">
        <LoadingBlock label="Loading invitation…" />
      </TalentShell>
    )
  }

  return (
    <TalentShell
      title="Company invitation"
      subtitle="Accept to join your company's hiring workspace. This does not change your candidate account."
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {invite ? (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Company</dt>
              <dd className="font-medium text-slate-900">{invite.organizationName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Invited email</dt>
              <dd className="text-slate-800">{invite.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="text-slate-800 capitalize">{invite.role.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="text-slate-800 capitalize">{invite.status}</dd>
            </div>
          </dl>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy || !token || invite?.status !== 'pending'}
            onClick={() => void accept()}
            className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
          >
            {busy ? 'Accepting…' : 'Accept invitation'}
          </Button>
          <Link href="/employer/pending">
            <Button variant="outline" className="rounded-xl">
              Hiring status
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" className="rounded-xl">
              Browse jobs
            </Button>
          </Link>
        </div>
        {!token ? (
          <p className="text-sm text-slate-600">
            Use the invitation link from your email to accept. Sign in with the invited address first if
            needed.
          </p>
        ) : null}
      </div>
    </TalentShell>
  )
}

export default function EmployerInvitationPage() {
  return (
    <Suspense
      fallback={
        <TalentShell title="Company invitation">
          <LoadingBlock label="Loading invitation…" />
        </TalentShell>
      }
    >
      <InvitationInner />
    </Suspense>
  )
}
