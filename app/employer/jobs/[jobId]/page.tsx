'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { JobEditor } from '@/components/recruitment/job-editor'
import { Button } from '@/components/ui/button'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { toDatetimeLocalValue } from '@/lib/recruitment/job-deadline'

type Member = { user_id: string; role: string; user?: { email?: string; first_name?: string } | null }

export default function EmployerJobDetailPage() {
  const params = useParams<{ jobId: string }>()
  const { orgId, canWriteJobs } = useEmployerOrg()
  const [job, setJob] = useState<Record<string, unknown> | null>(null)
  const [assignments, setAssignments] = useState<Array<{ user_id: string }>>([])
  const [hiringManagers, setHiringManagers] = useState<Member[]>([])
  const [assignUserId, setAssignUserId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    if (!orgId || !params.jobId) return
    const res = await fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (res.ok) setJob(data.job)
    else setError(data.error || 'Could not load job')

    if (canWriteJobs) {
      const [assignRes, membersRes] = await Promise.all([
        fetch(`/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/assignments`, {
          credentials: 'same-origin',
        }),
        fetch(`/api/recruitment/organizations/${orgId}/members`, { credentials: 'same-origin' }),
      ])
      if (assignRes.ok) {
        const body = await assignRes.json()
        setAssignments(body.assignments ?? [])
      }
      if (membersRes.ok) {
        const body = await membersRes.json()
        setHiringManagers(
          (body.members ?? []).filter((m: Member) => m.role === 'hiring_manager')
        )
      }
    }
  }

  useEffect(() => {
    void load()
  }, [orgId, params.jobId, canWriteJobs])

  const assign = async () => {
    setError('')
    setMessage('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/assignments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: assignUserId }),
      }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not assign')
    else {
      setMessage('Hiring manager assigned to this job.')
      setAssignUserId('')
      await load()
    }
  }

  const unassign = async (userId: string) => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/assignments?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE', credentials: 'same-origin' }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not remove assignment')
    else await load()
  }

  const deadline = toDatetimeLocalValue(
    job?.application_deadline != null ? String(job.application_deadline) : null
  )

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{String(job?.title ?? 'Job')}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/employer/jobs/${params.jobId}/compare`}>
            <Button variant="outline">Compare candidates</Button>
          </Link>
          <Link href={`/employer/jobs/${params.jobId}/screening`}>
            <Button variant="outline">Screening configuration</Button>
          </Link>
        </div>
      </div>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
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
        <p className="text-sm text-slate-600">
          You can review this role. Editing requires HR or admin access.
        </p>
      ) : (
        <p className="text-sm text-slate-600">Loading job…</p>
      )}

      {canWriteJobs ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold">Hiring manager assignments</h2>
          <p className="text-xs text-slate-500">
            Hiring managers only see candidates and data for jobs they are assigned to.
          </p>
          {(assignments ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No hiring managers assigned yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {assignments.map((row) => {
                const member = hiringManagers.find((m) => m.user_id === row.user_id)
                return (
                  <li key={row.user_id} className="flex items-center justify-between gap-2">
                    <span>{member?.user?.email || row.user_id}</span>
                    <Button variant="outline" size="sm" onClick={() => void unassign(row.user_id)}>
                      Remove
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="h-10 rounded-xl border px-3 text-sm"
            >
              <option value="">Select hiring manager…</option>
              {hiringManagers
                .filter((m) => !assignments.some((a) => a.user_id === m.user_id))
                .map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user?.email || m.user_id}
                  </option>
                ))}
            </select>
            <Button
              className="bg-[var(--brand-navy)] text-white"
              disabled={!assignUserId}
              onClick={() => void assign()}
            >
              Assign
            </Button>
          </div>
        </section>
      ) : null}
    </EmployerShell>
  )
}
