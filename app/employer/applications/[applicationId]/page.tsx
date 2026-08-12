'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { EMPLOYER_PIPELINE_STATUSES, formatApplicationStatus } from '@/lib/recruitment/types'

export default function EmployerApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>()
  const { orgId } = useEmployerOrg()
  const [data, setData] = useState<{
    application?: {
      id: string
      status: string
      cv_document_id: string | null
      profile_snapshot: Record<string, unknown>
      job?: { title?: string }
    }
    history?: Array<{ id: string; from_status: string | null; to_status: string; created_at: string }>
    notes?: Array<{ id: string; body: string; created_at: string }>
  } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!orgId) return
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}`,
      { credentials: 'same-origin' }
    )
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    void load()
  }, [orgId, params.applicationId])

  const setStatus = async (status: string) => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status }),
      }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not update status')
    else await load()
  }

  const addNote = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body: note }),
      }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not add note')
    else {
      setNote('')
      await load()
    }
  }

  const openCv = async () => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/applications/${params.applicationId}/cv`,
      { credentials: 'same-origin' }
    )
    const body = await res.json()
    if (!res.ok) setError(body.error || 'Could not open CV')
    else if (body.url) window.open(body.url, '_blank', 'noopener,noreferrer')
  }

  const snapshot = data?.application?.profile_snapshot ?? {}

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">
        {String(snapshot.full_name || 'Candidate')} · {data?.application?.job?.title}
      </h1>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            Status: {data?.application ? formatApplicationStatus(data.application.status as never) : '—'}
          </span>
          <select
            value={data?.application?.status ?? ''}
            onChange={(e) => void setStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm"
          >
            {EMPLOYER_PIPELINE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatApplicationStatus(status)}
              </option>
            ))}
          </select>
          {data?.application?.cv_document_id ? (
            <Button variant="outline" onClick={() => void openCv()}>
              Open CV (signed link)
            </Button>
          ) : (
            <span className="text-sm text-slate-500">No CV attached</span>
          )}
        </div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{String(snapshot.email || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Headline</dt>
            <dd>{String(snapshot.headline || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Location</dt>
            <dd>{String(snapshot.location || '—')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd>{String(snapshot.phone || '—')}</dd>
          </div>
        </dl>
        {snapshot.summary ? <p className="text-sm text-slate-700 whitespace-pre-wrap">{String(snapshot.summary)}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Internal HR notes</h2>
        <p className="text-xs text-slate-500">Never shown to candidates.</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl min-h-24" />
        <Button onClick={() => void addNote()} className="bg-[var(--brand-navy)] text-white">
          Add note
        </Button>
        <div className="space-y-2">
          {(data?.notes ?? []).map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p>{item.body}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
        <h2 className="font-semibold">Status history</h2>
        {(data?.history ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No status changes recorded yet.</p>
        ) : (
          (data?.history ?? []).map((row) => (
            <p key={row.id} className="text-sm text-slate-700">
              {row.from_status || '—'} → {row.to_status} · {new Date(row.created_at).toLocaleString()}
            </p>
          ))
        )}
      </section>
    </EmployerShell>
  )
}
