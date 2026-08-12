'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        router.replace('/jobs/auth/continue')
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
      <main className="min-h-screen flex items-center justify-center text-slate-600">
        Loading…
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
            Employer portal · Phase 1 foundation
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Your organizations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tenant memberships only. Job posting and screening arrive in later phases.
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-8 text-sm text-slate-600">
              You are not a member of any employer organization yet. Platform admins can add you
              under Admin → Talent organizations.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <Card key={m.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">
                    {m.organization?.name ?? 'Organization'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 space-y-1">
                  <p>
                    Role: <span className="font-medium">{m.role}</span>
                  </p>
                  {m.organization?.slug ? (
                    <Link
                      href={`/o/${m.organization.slug}`}
                      className="text-[var(--brand-navy)] underline text-xs"
                    >
                      Public page /o/{m.organization.slug}
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          <Link href="/jobs" className="underline text-[var(--brand-navy)]">
            Talent home
          </Link>
          {' · '}
          <Link href="/app" className="underline text-[var(--brand-navy)]">
            Candidate app
          </Link>
        </p>
      </div>
    </main>
  )
}
