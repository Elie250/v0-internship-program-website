'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { formatPipelineLabel } from '@/lib/recruitment/pipeline'
import { StatusBanner } from '@/components/recruitment/talent-ui'

type CompareRow = {
  applicationId: string
  displayName: string
  status: string
  submittedAt: string
  technicalScore: number | null
  integrityBand: string | null
  screeningCompleted: boolean
}

export default function EmployerJobComparePage() {
  const params = useParams<{ jobId: string }>()
  const { orgId } = useEmployerOrg()
  const [jobTitle, setJobTitle] = useState('')
  const [rows, setRows] = useState<CompareRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orgId) return
    void (async () => {
      const res = await fetch(
        `/api/recruitment/organizations/${orgId}/jobs/${params.jobId}/compare`,
        { credentials: 'same-origin' }
      )
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Could not load comparison')
      else {
        setJobTitle(data.job?.title ?? '')
        setRows(data.candidates ?? [])
      }
    })()
  }, [orgId, params.jobId])

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Compare candidates</h1>
          <p className="text-sm text-slate-600">{jobTitle || 'Job'}</p>
        </div>
        <Link href={`/employer/jobs/${params.jobId}`} className="text-sm text-[var(--brand-navy)]">
          ← Job
        </Link>
      </div>
      <StatusBanner tone="info">
        Objective fields only. Integrity is an advisory review signal — never a cheating verdict or
        auto-reject. This view does not auto-rank a “best hire”.
      </StatusBanner>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Technical score</th>
              <th className="px-4 py-3">Screening</th>
              <th className="px-4 py-3">Integrity (advisory)</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-600">
                  No applicants for this job yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.applicationId} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/employer/applications/${row.applicationId}`}
                      className="font-medium text-[var(--brand-navy)] hover:underline"
                    >
                      {row.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {row.technicalScore != null ? `${row.technicalScore}%` : '—'}
                  </td>
                  <td className="px-4 py-3">{row.screeningCompleted ? 'Completed' : '—'}</td>
                  <td className="px-4 py-3">{row.integrityBand ?? '—'}</td>
                  <td className="px-4 py-3">{new Date(row.submittedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{formatPipelineLabel(row.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </EmployerShell>
  )
}
