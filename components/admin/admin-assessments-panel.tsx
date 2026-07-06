'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, BadgeCheck } from 'lucide-react'

type CertificateRow = {
  id: string
  certificate_code: string
  student_name: string
  program_title: string
  final_score: number | null
  is_free: boolean
  status: string
  issued_at: string
  approved_at: string | null
}

/** Admin final approval for certificates confirmed by lecturers. */
export function AdminAssessmentsPanel({ courseId }: { courseId?: string }) {
  const [rows, setRows] = useState<CertificateRow[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<string | null>(null)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/certificates?courseId=${id}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load certificates')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (courseId) void load(courseId)
  }, [courseId, load])

  const approve = async (row: CertificateRow) => {
    if (!confirm(`Give final approval for ${row.student_name}'s certificate? The student will be emailed.`)) return
    setApproving(row.id)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: row.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')
      setMessage(`Certificate ${data.certificateCode} approved and emailed to ${row.student_name}.`)
      if (courseId) await load(courseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApproving(null)
    }
  }

  if (!courseId) return null

  const pending = rows.filter((r) => r.status === 'pending_admin')
  const issued = rows.filter((r) => r.status !== 'pending_admin')

  if (!loading && rows.length === 0 && !error) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Certificates — final approval</CardTitle>
        <p className="text-sm text-slate-600">
          Lecturers confirm passing averages first; certificates become valid after your approval.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{message}</p> : null}
        {error ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <>
            {pending.map((row) => (
              <div
                key={row.id}
                className="rounded border border-amber-200 bg-amber-50/60 p-3 text-sm flex justify-between gap-2 flex-wrap items-center"
              >
                <div>
                  <p className="font-medium text-slate-900">{row.student_name}</p>
                  <p className="text-slate-600">
                    {row.program_title}
                    {row.final_score != null ? ` · average ${row.final_score}%` : ''}
                    {row.is_free ? ' · free programme (watermarked certificate)' : ''}
                  </p>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{row.certificate_code}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-[var(--brand-navy)] text-white"
                  disabled={approving === row.id}
                  onClick={() => approve(row)}
                >
                  <BadgeCheck className="h-4 w-4 mr-1" />
                  {approving === row.id ? 'Approving…' : 'Approve certificate'}
                </Button>
              </div>
            ))}

            {issued.map((row) => (
              <div
                key={row.id}
                className="rounded border border-slate-200 p-3 text-sm flex justify-between gap-2 flex-wrap items-center"
              >
                <div>
                  <p className="font-medium text-slate-900">{row.student_name}</p>
                  <p className="text-slate-600">
                    {row.program_title}
                    {row.final_score != null ? ` · average ${row.final_score}%` : ''}
                  </p>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{row.certificate_code}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Award className="h-3 w-3 mr-1" />
                  Issued
                </Badge>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
