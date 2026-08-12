'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  EmptyState,
  LoadingBlock,
  StatusBanner,
  TalentShell,
} from '@/components/recruitment/talent-ui'
import {
  formatApplicationStatus,
  type RecruitmentApplicationStatus,
} from '@/lib/recruitment/types'

type Application = {
  id: string
  status: string
  submitted_at: string
  job?: {
    title?: string
    slug?: string
    organization?: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null
  } | null
}

type MeResponse = {
  user: { email: string; firstName?: string; lastName?: string }
  profileCompletion: { percent: number; missing: string[] }
  cvStatus: { hasCv: boolean; filename?: string; uploadedAt?: string }
  applications: Application[]
}

function orgName(app: Application): string {
  const org = app.job?.organization
  if (!org) return 'Employer'
  if (Array.isArray(org)) return org[0]?.name ?? 'Employer'
  return org.name ?? 'Employer'
}

function jobPath(app: Application): string | null {
  const org = app.job?.organization
  const slug = Array.isArray(org) ? org[0]?.slug : org?.slug
  const jobSlug = app.job?.slug
  if (!slug || !jobSlug) return null
  return `/o/${slug}/jobs/${jobSlug}`
}

export default function CandidateDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [me, setMe] = useState<MeResponse | null>(null)

  const load = async () => {
    const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
    if (res.status === 401) {
      router.replace('/jobs/auth/continue?redirect=/app')
      return
    }
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to load dashboard')
      setLoading(false)
      return
    }
    setMe(data)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [router])

  const withdraw = async (applicationId: string) => {
    setBusyId(applicationId)
    setError('')
    try {
      const res = await fetch('/api/recruitment/candidate/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ applicationId, action: 'withdraw' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Withdraw failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed')
    } finally {
      setBusyId('')
    }
  }

  if (loading) {
    return (
      <TalentShell title="My applications">
        <LoadingBlock label="Loading your dashboard…" />
      </TalentShell>
    )
  }

  const percent = me?.profileCompletion.percent ?? 0

  return (
    <TalentShell
      title="My applications"
      subtitle={me?.user.email ? `Signed in as ${me.user.email}` : undefined}
    >
      <div className="grid lg:grid-cols-[1fr_1.35fr] gap-6 lg:gap-8">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Profile strength</h2>
                <p className="text-sm text-slate-600 mt-0.5">Helps employers review you faster</p>
              </div>
              <p className="text-2xl font-semibold text-[var(--brand-navy)]">{percent}%</p>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--brand-navy)] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            {me?.profileCompletion.missing.length ? (
              <p className="text-sm text-slate-600">
                Still helpful: {me.profileCompletion.missing.join(', ')}
              </p>
            ) : (
              <StatusBanner tone="success">Your profile looks strong.</StatusBanner>
            )}
            <Link href="/app/profile">
              <Button variant="outline" size="sm" className="rounded-lg">
                Edit profile
              </Button>
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <h2 className="text-base font-semibold text-slate-900">CV</h2>
            {me?.cvStatus.hasCv ? (
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-medium text-slate-900">{me.cvStatus.filename}</p>
                {me.cvStatus.uploadedAt ? (
                  <p className="text-slate-500">
                    Uploaded {new Date(me.cvStatus.uploadedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No CV uploaded yet.</p>
            )}
            <Link href="/app/profile#cv">
              <Button variant="outline" size="sm" className="rounded-lg">
                Manage CV
              </Button>
            </Link>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Applications</h2>
              <p className="text-sm text-slate-600">Track status across employers</p>
            </div>
            <Link href="/jobs">
              <Button size="sm" className="rounded-lg bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                Find jobs
              </Button>
            </Link>
          </div>

          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

          {!me?.applications?.length ? (
            <EmptyState
              title="No applications yet"
              description="Browse open roles and apply with your reusable profile and CV."
              action={
                <Link href="/jobs">
                  <Button className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                    Browse jobs
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {me.applications.map((app) => {
                const href = jobPath(app)
                const canWithdraw = app.status === 'submitted' || app.status === 'under_review'
                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">{orgName(app)}</p>
                        <p className="font-semibold text-slate-900">{app.job?.title ?? 'Role'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Applied {new Date(app.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-slate-200 font-normal">
                        {formatApplicationStatus(app.status as RecruitmentApplicationStatus)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {href ? (
                        <Link
                          href={href}
                          className="text-sm font-medium text-[var(--brand-navy)] hover:underline"
                        >
                          View job
                        </Link>
                      ) : null}
                      {canWithdraw ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={busyId === app.id}
                          onClick={() => void withdraw(app.id)}
                        >
                          {busyId === app.id ? 'Withdrawing…' : 'Withdraw'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </TalentShell>
  )
}
