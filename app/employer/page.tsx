'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { formatApplicationStatus } from '@/lib/recruitment/types'

type Metrics = {
  activeJobs: number
  newApplications: number
  applications: number
  underReview: number
  screeningsPending: number
  screeningCompleted: number
  shortlisted: number
  interviewsUpcoming: number
  offers: number
  hires: number
}

export default function EmployerDashboardPage() {
  const [data, setData] = useState<{
    metrics: Metrics
    recentJobs: Array<{ id: string; title: string; status: string }>
    recentApplications: Array<{
      id: string
      status: string
      job?: { title?: string } | null
      profile_snapshot?: { full_name?: string }
    }>
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
          <h1 className="text-2xl font-semibold text-slate-900">HR dashboard</h1>
          <p className="text-sm text-slate-600">{data?.organization?.name ?? 'Employer workspace'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employer/interviews">
            <Button variant="outline">Interviews</Button>
          </Link>
          <Link href="/employer/jobs/new">
            <Button className="bg-[var(--brand-navy)] text-white">Create job</Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Active jobs', metrics?.activeJobs ?? 0],
          ['New applications', metrics?.newApplications ?? 0],
          ['Under review', metrics?.underReview ?? 0],
          ['Screening completed', metrics?.screeningCompleted ?? 0],
          ['Interviews upcoming', metrics?.interviewsUpcoming ?? 0],
          ['Offers', metrics?.offers ?? 0],
          ['Hires', metrics?.hires ?? 0],
          ['In screening', metrics?.screeningsPending ?? 0],
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
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent applicants</h2>
            <Link href="/employer/applications" className="text-xs text-[var(--brand-navy)]">
              View all
            </Link>
          </div>
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
