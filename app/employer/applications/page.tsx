'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { formatApplicationStatus } from '@/lib/recruitment/types'

type AppRow = {
  id: string
  status: string
  submitted_at: string
  profile_snapshot?: { full_name?: string; email?: string }
  job?: { title?: string }
  latestIntegrityBand?: string | null
}

function integrityListHint(band: string | null | undefined) {
  if (!band) return null
  if (band === 'REVIEW' || band === 'HIGH_CONCERN') {
    return { label: `Integrity: ${band}`, className: 'text-amber-800 bg-amber-50' }
  }
  if (band === 'LOW_CONCERN') {
    return { label: `Integrity: ${band}`, className: 'text-slate-600 bg-slate-100' }
  }
  return { label: `Integrity: ${band}`, className: 'text-slate-500 bg-slate-50' }
}

export default function EmployerApplicationsPage() {
  const { orgId } = useEmployerOrg()
  const [apps, setApps] = useState<AppRow[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!orgId) return
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    void (async () => {
      const res = await fetch(`/api/recruitment/organizations/${orgId}/applications${qs}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok) setApps(data.applications ?? [])
    })()
  }, [orgId, status])

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Applicants</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {['submitted', 'under_review', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'].map(
            (value) => (
              <option key={value} value={value}>
                {formatApplicationStatus(value as never)}
              </option>
            )
          )}
        </select>
      </div>
      <p className="text-xs text-slate-500">
        Integrity bands are advisory review signals. They never reject a candidate automatically.
      </p>
      <div className="space-y-3">
        {apps.length === 0 ? (
          <p className="text-sm text-slate-600">No applications match this filter.</p>
        ) : (
          apps.map((app) => {
            const hint = integrityListHint(app.latestIntegrityBand)
            return (
              <Link
                key={app.id}
                href={`/employer/applications/${app.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold">{app.profile_snapshot?.full_name || 'Candidate'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {hint ? (
                      <span
                        className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${hint.className}`}
                      >
                        {hint.label}
                      </span>
                    ) : null}
                    <span className="text-xs uppercase tracking-wider text-slate-500">
                      {formatApplicationStatus(app.status as never)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {app.job?.title} · {new Date(app.submitted_at).toLocaleDateString()}
                </p>
              </Link>
            )
          })
        )}
      </div>
    </EmployerShell>
  )
}
