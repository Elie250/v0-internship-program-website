'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { formatApplicationDeadlineLabel } from '@/lib/recruitment/job-deadline'
import { formatEmploymentType } from '@/lib/recruitment/types'

type Job = {
  id: string
  title: string
  status: string
  location: string | null
  employment_type: string | null
  application_deadline: string | null
}

export default function EmployerJobsPage() {
  const { orgId, canWriteJobs } = useEmployerOrg()
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    if (!orgId) return
    void (async () => {
      const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs`, { credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok) setJobs(data.jobs ?? [])
    })()
  }, [orgId])

  return (
    <EmployerShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        {canWriteJobs ? (
          <Link href="/employer/jobs/new">
            <Button className="bg-[var(--brand-navy)] text-white">Create job</Button>
          </Link>
        ) : null}
      </div>
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-600">No jobs in this organization yet.</p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-slate-900">{job.title}</p>
                <span className="text-xs uppercase tracking-wider text-slate-500">{job.status}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {[job.location, job.employment_type ? formatEmploymentType(job.employment_type as never) : null]
                  .filter(Boolean)
                  .join(' · ')}
                {` · ${formatApplicationDeadlineLabel(job.application_deadline)}`}
              </p>
            </Link>
          ))
        )}
      </div>
    </EmployerShell>
  )
}
