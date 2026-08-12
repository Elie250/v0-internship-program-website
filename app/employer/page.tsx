'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { formatApplicationStatus } from '@/lib/recruitment/types'

type Metrics = {
  activeJobs: number
  applications: number
  underReview: number
  screeningsPending: number
  shortlisted: number
}

export default function EmployerDashboardPage() {
  const [data, setData] = useState<{
    metrics: Metrics
    recentJobs: Array<{ id: string; title: string; status: string }>
    recentApplications: Array<{ id: string; status: string; job?: { title?: string } | null; profile_snapshot?: { full_name?: string } }>
    organization?: { id: string; name: string }
  } | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/recruitment/employer/dashboard', { credentials: 'same-origin' })
      if (res.ok) setData(await res.json())
    })()
  }, [])

  const metrics = data?.metrics

  return (
    <EmployerShell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">{data?.organization?.name ?? 'Employer workspace'}</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="bg-[var(--brand-navy)] text-white">Create job</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Active Jobs', metrics?.activeJobs ?? 0],
          ['Applications', metrics?.applications ?? 0],
          ['Under Review', metrics?.underReview ?? 0],
          ['Screenings Pending', metrics?.screeningsPending ?? 0],
          ['Shortlisted', metrics?.shortlisted ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold">Recent jobs</h2>
          {(data?.recentJobs ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No jobs yet.</p>
          ) : (
            data?.recentJobs.map((job) => (
              <Link key={job.id} href={`/employer/jobs/${job.id}`} className="block text-sm">
                <span className="font-medium text-slate-900">{job.title}</span>
                <span className="ml-2 text-slate-500">{job.status}</span>
              </Link>
            ))
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold">Recent applications</h2>
          {(data?.recentApplications ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No applications yet.</p>
          ) : (
            data?.recentApplications.map((app) => (
              <Link key={app.id} href={`/employer/applications/${app.id}`} className="block text-sm">
                <span className="font-medium text-slate-900">
                  {app.profile_snapshot?.full_name || 'Candidate'}
                </span>
                <span className="ml-2 text-slate-500">
                  {app.job?.title} · {formatApplicationStatus(app.status as never)}
                </span>
              </Link>
            ))
          )}
        </section>
      </div>
    </EmployerShell>
  )
}
