'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { JobEditor } from '@/components/recruitment/job-editor'
import { Button } from '@/components/ui/button'

export default function EmployerJobDetailPage() {
  const params = useParams<{ jobId: string }>()
  const { orgId, canWriteJobs } = useEmployerOrg()
  const [job, setJob] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!orgId || !params.jobId) return
    void (async () => {
      const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok) setJob(data.job)
    })()
  }, [orgId, params.jobId])

  const deadline = job?.application_deadline
    ? new Date(String(job.application_deadline)).toISOString().slice(0, 16)
    : ''

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{String(job?.title ?? 'Job')}</h1>
        <Link href={`/employer/jobs/${params.jobId}/screening`}>
          <Button variant="outline">Screening configuration</Button>
        </Link>
      </div>
      {job && orgId && canWriteJobs ? (
        <JobEditor
          organizationId={orgId}
          jobId={params.jobId}
          initial={{
            title: String(job.title ?? ''),
            department: String(job.department ?? ''),
            location: String(job.location ?? ''),
            employmentType: String(job.employment_type ?? 'full_time'),
            workMode: String(job.work_mode ?? 'on_site'),
            category: String(job.category ?? ''),
            description: String(job.description ?? ''),
            responsibilities: String(job.responsibilities ?? ''),
            requirements: String(job.requirements ?? ''),
            qualifications: String(job.qualifications ?? ''),
            skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
            salaryMin: job.salary_min != null ? String(job.salary_min) : '',
            salaryMax: job.salary_max != null ? String(job.salary_max) : '',
            salaryCurrency: String(job.salary_currency ?? 'RWF'),
            salaryVisible: Boolean(job.salary_visible),
            applicationDeadline: deadline,
            status: String(job.status ?? 'draft'),
            visibility: String(job.visibility ?? 'public'),
          }}
        />
      ) : job ? (
        <p className="text-sm text-slate-600">You can review this role. Editing requires HR or admin access.</p>
      ) : (
        <p className="text-sm text-slate-600">Loading job…</p>
      )}
    </EmployerShell>
  )
}
