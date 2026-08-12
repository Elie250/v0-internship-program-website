'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  EmptyState,
  LoadingBlock,
  TalentShell,
} from '@/components/recruitment/talent-ui'
import { Button } from '@/components/ui/button'

export default function EmployerPortalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [memberships, setMemberships] = useState<
    Array<{
      id: string
      role: string
      organization?: { name?: string; slug?: string; status?: string } | null
    }>
  >([])

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
      if (res.status === 401) {
        router.replace('/jobs/auth/continue?redirect=/employer')
        return
      }
      const data = await res.json()
      const list = (data.memberships ?? []).map(
        (m: {
          id: string
          role: string
          organization?:
            | { name?: string; slug?: string; status?: string }
            | { name?: string; slug?: string; status?: string }[]
            | null
        }) => ({
          id: m.id,
          role: m.role,
          organization: Array.isArray(m.organization) ? m.organization[0] : m.organization,
        })
      )
      setMemberships(list)
      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return (
      <TalentShell title="Employer access">
        <LoadingBlock label="Loading organizations…" />
      </TalentShell>
    )
  }

  return (
    <TalentShell
      title="Employer access"
      subtitle="Your organization memberships on this careers platform"
    >
      <div className="max-w-2xl space-y-5">
        {memberships.length === 0 ? (
          <EmptyState
            title="No employer memberships yet"
            description="Platform admins can add you to an organization when employer tools are available for your team."
            action={
              <Link href="/jobs">
                <Button variant="outline" className="rounded-xl">
                  Browse candidate job board
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
              >
                <p className="text-lg font-semibold text-slate-900">
                  {m.organization?.name ?? 'Organization'}
                </p>
                <p className="text-sm text-slate-600">
                  Role: <span className="font-medium text-slate-800">{m.role}</span>
                </p>
                {m.organization?.slug ? (
                  <Link
                    href={`/o/${m.organization.slug}`}
                    className="inline-block text-sm font-medium text-[var(--brand-navy)] hover:underline"
                  >
                    View public employer page
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-600">
          <Link href="/jobs" className="font-medium text-[var(--brand-navy)] hover:underline">
            Job board
          </Link>
          {' · '}
          <Link href="/app" className="font-medium text-[var(--brand-navy)] hover:underline">
            Candidate dashboard
          </Link>
        </p>
      </div>
    </TalentShell>
  )
}
