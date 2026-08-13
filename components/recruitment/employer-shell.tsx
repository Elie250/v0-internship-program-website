'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandMark, LoadingBlock, StatusBanner } from '@/components/recruitment/talent-ui'
import { AccountSignOutButton } from '@/components/recruitment/account-menu'
import { Button } from '@/components/ui/button'

type OrgOption = {
  id: string
  name: string
  slug: string
  status: string
  role: string
}

const NAV = [
  { href: '/employer', label: 'Dashboard' },
  { href: '/employer/jobs', label: 'Jobs' },
  { href: '/employer/applications', label: 'Applicants' },
  { href: '/employer/interviews', label: 'Interviews' },
  { href: '/employer/screening', label: 'Screening' },
  { href: '/employer/team', label: 'Team' },
  { href: '/employer/settings', label: 'Settings' },
]

export function EmployerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [active, setActive] = useState<OrgOption | null>(null)
  const [role, setRole] = useState('')

  const load = async () => {
    const res = await fetch('/api/recruitment/employer/context', { credentials: 'same-origin' })
    if (res.status === 401) {
      router.replace('/jobs/auth/continue?redirect=/employer')
      return
    }
    if (res.status === 403) {
      router.replace('/employer/pending')
      return
    }
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not load employer workspace')
      setLoading(false)
      return
    }
    setOrgs(data.organizations ?? [])
    setActive(data.organization ?? null)
    setRole(data.organization?.role ?? '')
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [router])

  const switchOrg = async (organizationId: string) => {
    await fetch('/api/recruitment/employer/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ organizationId }),
    })
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen recruitment-surface p-6">
        <LoadingBlock label="Loading employer workspace…" />
      </div>
    )
  }

  if (error === 'no-access') {
    return (
      <div className="min-h-screen recruitment-surface">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <BrandMark />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Employer workspace</h1>
          <p className="text-slate-600">
            This account does not belong to an employer organization. Continue as a candidate, or
            ask an organization admin to add you.
          </p>
          <div className="flex gap-3">
            <Link href="/app">
              <Button variant="outline">Candidate dashboard</Button>
            </Link>
            <Link href="/jobs">
              <Button className="bg-[var(--brand-navy)] text-white">Browse jobs</Button>
            </Link>
            <AccountSignOutButton redirectTo="/jobs" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[var(--brand-navy)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BrandMark href="https://www.energyandlogics.com" compact light />
            <span className="hidden sm:inline text-xs uppercase tracking-[0.16em] text-white/70">
              Employer workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            {orgs.length > 1 ? (
              <select
                value={active?.id ?? ''}
                onChange={(e) => void switchOrg(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id} className="text-slate-900">
                    {org.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-white/90">{active?.name}</span>
            )}
            <Link href="/app" className="text-xs text-white/80 hover:text-white">
              Candidate view
            </Link>
            <Link href="/jobs/auth/choose" className="text-xs text-white/80 hover:text-white">
              Switch workspace
            </Link>
            <AccountSignOutButton redirectTo="/jobs" light className="rounded-lg h-8 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 h-fit sticky top-24">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-wider text-slate-500">
            {role.replace(/_/g, ' ')}
          </p>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const activeNav =
                item.href === '/employer'
                  ? pathname === '/employer'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    activeNav
                      ? 'bg-[var(--brand-navy)] text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 space-y-6">
          {error && error !== 'no-access' ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          {children}
        </main>
      </div>
    </div>
  )
}

export function useEmployerOrg() {
  const [orgId, setOrgId] = useState('')
  const [role, setRole] = useState('')
  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/recruitment/employer/context', { credentials: 'same-origin' })
      if (!res.ok) return
      const data = await res.json()
      setOrgId(data.organization?.id ?? '')
      setRole(data.organization?.role ?? '')
    })()
  }, [])
  return {
    orgId,
    role,
    canWriteJobs: role === 'organization_admin' || role === 'hr_recruiter' || role === 'platform_admin',
    canManageTeam: role === 'organization_admin' || role === 'platform_admin',
    canWriteScreening: role === 'organization_admin' || role === 'hr_recruiter' || role === 'platform_admin',
    canSettings: role === 'organization_admin' || role === 'platform_admin',
    canDecide:
      role === 'organization_admin' || role === 'hr_recruiter' || role === 'platform_admin',
    canInterview:
      role === 'organization_admin' ||
      role === 'hr_recruiter' ||
      role === 'hiring_manager' ||
      role === 'platform_admin',
  }
}
