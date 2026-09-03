'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { downloadOrgReport, type OrgReportKind } from '@/lib/recruitment/interview-stage-report-pdf'
import {
  formatInterviewTypeLabel,
  formatInterviewWhenShort,
} from '@/lib/recruitment/interview-format'

type InterviewRow = {
  id: string
  application_id: string
  job_id: string
  interview_type: string
  status: string
  scheduled_at: string
  timezone?: string | null
  location: string | null
  meeting_url: string | null
  candidate_name?: string
  candidate_email?: string
  job_title?: string
}

export default function EmployerInterviewsPage() {
  const { orgId } = useEmployerOrg()
  const [interviews, setInterviews] = useState<InterviewRow[]>([])
  const [error, setError] = useState('')
  const [reportBusy, setReportBusy] = useState<OrgReportKind | ''>('')

  const downloadReport = async (kind: OrgReportKind) => {
    if (!orgId) return
    setError('')
    setReportBusy(kind)
    try {
      await downloadOrgReport(orgId, kind)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download report')
    } finally {
      setReportBusy('')
    }
  }

  useEffect(() => {
    if (!orgId) return
    void (async () => {
      const res = await fetch(`/api/recruitment/organizations/${orgId}/interviews`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Could not load interviews')
      else setInterviews(data.interviews ?? [])
    })()
  }, [orgId])

  return (
    <EmployerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Interviews</h1>
          <p className="text-sm text-slate-600">
            All scheduled interviews stay on this list after start time so you can still give marks. Scores do not
            auto-hire.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={!orgId || Boolean(reportBusy)}
            onClick={() => void downloadReport('interview-placement')}
          >
            {reportBusy === 'interview-placement' ? 'Preparing PDF…' : 'Placement PDF'}
          </Button>
          <Button
            variant="outline"
            disabled={!orgId || Boolean(reportBusy)}
            onClick={() => void downloadReport('interview-stage')}
          >
            {reportBusy === 'interview-stage' ? 'Preparing PDF…' : 'Interview-stage PDF'}
          </Button>
          <Button
            variant="outline"
            disabled={!orgId || Boolean(reportBusy)}
            onClick={() => void downloadReport('interview-results')}
          >
            {reportBusy === 'interview-results' ? 'Preparing PDF…' : 'Interview results PDF'}
          </Button>
        </div>
      </div>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="space-y-3">
        {interviews.length === 0 ? (
          <p className="text-sm text-slate-600">
            No interviews yet. Open an applicant and invite them from the application page.
          </p>
        ) : (
          interviews.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {row.candidate_name || 'Candidate'}
                  {row.candidate_email ? (
                    <span className="font-normal text-slate-600"> · {row.candidate_email}</span>
                  ) : null}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {row.job_title || 'Role'} · {formatInterviewWhenShort(row.scheduled_at, row.timezone)} ·{' '}
                  {formatInterviewTypeLabel(row.interview_type)}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {row.status}
                  {row.location ? ` · ${row.location}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/employer/applications/${row.application_id}`}>
                  <Button variant="outline" size="sm">
                    Application
                  </Button>
                </Link>
                <Link href={`/employer/interviews/${row.id}`}>
                  <Button size="sm" className="bg-[var(--brand-navy)] text-white">
                    Open interview
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </EmployerShell>
  )
}
